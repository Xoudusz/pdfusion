import logging
import os
import shutil
import signal
import subprocess
import tempfile
import time
from fastapi import FastAPI, UploadFile, Form
from fastapi.responses import Response

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("pdfusion")

VERSION = (open("/app/VERSION").read().strip() if os.path.exists("/app/VERSION") else "dev")

BANNER = """
  ██████╗ ██████╗ ███████╗██╗   ██╗███████╗██╗ ██████╗ ███╗   ██╗
  ██╔══██╗██╔══██╗██╔════╝██║   ██║██╔════╝██║██╔═══██╗████╗  ██║
  ██████╔╝██║  ██║█████╗  ██║   ██║███████╗██║██║   ██║██╔██╗ ██║
  ██╔═══╝ ██║  ██║██╔══╝  ██║   ██║╚════██║██║██║   ██║██║╚██╗██║
  ██║     ██████╔╝██║     ╚██████╔╝███████║██║╚██████╔╝██║ ╚████║
  ╚═╝     ╚═════╝ ╚═╝      ╚═════╝ ╚══════╝╚═╝ ╚═════╝ ╚═╝  ╚═══╝
"""

app = FastAPI()


@app.on_event("startup")
async def startup():
    print(BANNER)
    gs_path = shutil.which("gs") or "not found"
    log.info("ready — port 8000 | gs %s | v%s", gs_path, VERSION)


def _fmt_bytes(n: int) -> str:
    if n < 1024 * 1024:
        return f"{n / 1024:.0f} KB"
    return f"{n / (1024 * 1024):.1f} MB"


@app.post("/api/compress")
async def compress(file: UploadFile, dpi: int = Form(150)):
    if dpi <= 72:
        gs_preset = "/screen"
    elif dpi <= 150:
        gs_preset = "/ebook"
    else:
        gs_preset = "/printer"

    data = await file.read()
    size_in = len(data)

    MAX_BYTES = 100 * 1024 * 1024
    if size_in > MAX_BYTES:
        log.warning("[compress] rejected — %s too large (%s)", file.filename, _fmt_bytes(size_in))
        return Response(
            content=f"File too large ({_fmt_bytes(size_in)}) — 100 MB limit. Try splitting the PDF first.",
            status_code=413,
        )

    log.info("[compress] %s — %s dpi=%d preset=%s", file.filename, _fmt_bytes(size_in), dpi, gs_preset)

    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as inp:
        inp.write(data)
        inp_path = inp.name

    out_path = inp_path + "_out.pdf"
    t0 = time.monotonic()
    try:
        result = subprocess.run(
            [
                "gs",
                "-sDEVICE=pdfwrite",
                f"-dPDFSETTINGS={gs_preset}",
                "-dCompatibilityLevel=1.4",
                "-dNOPAUSE",
                "-dQUIET",
                "-dBATCH",
                "-dMaxBitmap=268435456",
                "-dBufferSpace=4194304",
                "-dDownsampleColorImages=true",
                f"-dColorImageResolution={dpi}",
                "-dDownsampleGrayImages=true",
                f"-dGrayImageResolution={dpi}",
                "-dDownsampleMonoImages=true",
                f"-dMonoImageResolution={min(dpi, 300)}",
                f"-sOutputFile={out_path}",
                inp_path,
            ],
            timeout=600,
        )
        elapsed = time.monotonic() - t0

        if result.returncode == -signal.SIGKILL:
            log.warning("[compress] OOM kill after %.0fs — %s", elapsed, file.filename)
            return Response(
                content="Out of memory — file too large to process on this server",
                status_code=507,
            )
        if result.returncode != 0:
            log.warning("[compress] gs exit %d after %.0fs — %s", result.returncode, elapsed, file.filename)
            return Response(
                content=f"Ghostscript failed (exit {result.returncode})",
                status_code=500,
            )

        with open(out_path, "rb") as f:
            output = f.read()

        size_out = len(output)
        pct = round((1 - size_out / size_in) * 100) if size_in else 0
        log.info(
            "[compress] done — %s → %s (−%d%%) in %.0fs",
            _fmt_bytes(size_in), _fmt_bytes(size_out), pct, elapsed,
        )
        return Response(content=output, media_type="application/pdf")

    except subprocess.TimeoutExpired:
        elapsed = time.monotonic() - t0
        log.warning("[compress] timeout after %.0fs — %s", elapsed, file.filename)
        return Response(content="Processing timed out (>10 min)", status_code=500)
    finally:
        os.unlink(inp_path)
        if os.path.exists(out_path):
            os.unlink(out_path)
