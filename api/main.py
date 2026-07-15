import os, subprocess, tempfile
from fastapi import FastAPI, UploadFile, Form
from fastapi.responses import Response

app = FastAPI()

PRESETS = {
    "small":    "/screen",
    "balanced": "/ebook",
    "quality":  "/printer",
}

@app.post("/api/compress")
async def compress(file: UploadFile, preset: str = Form("balanced")):
    gs_preset = PRESETS.get(preset, "/ebook")
    data = await file.read()

    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as inp:
        inp.write(data)
        inp_path = inp.name

    out_path = inp_path + "_out.pdf"
    try:
        subprocess.run(
            [
                "gs",
                "-sDEVICE=pdfwrite",
                f"-dPDFSETTINGS={gs_preset}",
                "-dCompatibilityLevel=1.4",
                "-dNOPAUSE",
                "-dQUIET",
                "-dBATCH",
                f"-sOutputFile={out_path}",
                inp_path,
            ],
            check=True,
            timeout=300,
        )
        with open(out_path, "rb") as f:
            result = f.read()
        return Response(content=result, media_type="application/pdf")
    except subprocess.CalledProcessError as e:
        return Response(content=f"Ghostscript error: {e}", status_code=500)
    except subprocess.TimeoutExpired:
        return Response(content="Processing timed out", status_code=500)
    finally:
        os.unlink(inp_path)
        if os.path.exists(out_path):
            os.unlink(out_path)
