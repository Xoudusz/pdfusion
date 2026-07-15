import os, signal, subprocess, tempfile
from fastapi import FastAPI, UploadFile, Form
from fastapi.responses import Response

app = FastAPI()

@app.post("/api/compress")
async def compress(file: UploadFile, dpi: int = Form(150)):
    if dpi <= 72:
        gs_preset = "/screen"
    elif dpi <= 150:
        gs_preset = "/ebook"
    else:
        gs_preset = "/printer"

    data = await file.read()

    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as inp:
        inp.write(data)
        inp_path = inp.name

    out_path = inp_path + "_out.pdf"
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
                # Cap per-page bitmap RAM to avoid OOM kills on large files
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
        if result.returncode == -signal.SIGKILL:
            return Response(
                content="Out of memory — file too large to process on this server",
                status_code=507,
            )
        if result.returncode != 0:
            return Response(
                content=f"Ghostscript failed (exit {result.returncode})",
                status_code=500,
            )
        with open(out_path, "rb") as f:
            output = f.read()
        return Response(content=output, media_type="application/pdf")
    except subprocess.TimeoutExpired:
        return Response(content="Processing timed out (>10 min)", status_code=500)
    finally:
        os.unlink(inp_path)
        if os.path.exists(out_path):
            os.unlink(out_path)
