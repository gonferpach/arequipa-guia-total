FROM node:20-alpine AS builder

WORKDIR /repo

COPY frontend/package.json ./frontend/
COPY frontend/next.config.js ./frontend/
COPY frontend/tailwind.config.js ./frontend/
COPY frontend/postcss.config.js ./frontend/
COPY frontend/app ./frontend/app
COPY frontend/public ./frontend/public
COPY templates ./templates

WORKDIR /repo/frontend
RUN npm install
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /repo/frontend/.next/standalone ./
COPY --from=builder /repo/frontend/.next/static ./.next/static
COPY --from=builder /repo/frontend/public ./public

EXPOSE 3005
CMD ["node", "server.js"]