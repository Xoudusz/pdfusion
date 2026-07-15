FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine

# Python + Ghostscript + supervisor
RUN apk add --no-cache python3 py3-pip ghostscript supervisor

# FastAPI deps in venv (avoids PEP 668 restrictions)
RUN python3 -m venv /opt/venv && \
    /opt/venv/bin/pip install --no-cache-dir fastapi "uvicorn[standard]" python-multipart

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY api/ /app/api/
COPY VERSION /app/VERSION
COPY supervisord.conf /etc/supervisord.conf

EXPOSE 80
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisord.conf"]
