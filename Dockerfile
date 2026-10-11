FROM node:18-alpine

# Cài đặt các công cụ biên dịch cần thiết
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Sao chép file cấu hình trước để tận dụng Docker layer cache
COPY package*.json ./

# Cài đặt sạch các gói, bỏ qua script tùy chỉnh để tránh lỗi crash
RUN npm install --omit=dev --legacy-peer-deps || npm install --legacy-peer-deps

# Sao chép toàn bộ mã nguồn còn lại
COPY . .

# Khởi chạy bot
CMD ["node", "index.js"]
