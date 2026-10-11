FROM node:18-alpine

# Cài đặt các gói bổ trợ hệ thống cần thiết cho các thư viện Node.js
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Sao chép file cấu hình package
COPY package*.json ./

# Cài đặt sạch các gói phụ thuộc
RUN npm install --legacy-peer-deps

# Sao chép toàn bộ mã nguồn còn lại vào container
COPY . .

# Lệnh khởi chạy bot
CMD ["node", "index.js"]
