/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',          // 关键：生成纯静态文件
  distDir: 'out',            // 输出文件夹叫 out
  images: {
    unoptimized: true        // 静态导出必须加这行
  }
};

export default nextConfig;