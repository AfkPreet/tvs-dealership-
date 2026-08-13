/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: true,
  reactStrictMode: true,
  // The stylesheet is inlined into every exported document by
  // scripts/inline-css.mjs, wired in as a postbuild step. See that file for why.
};

export default nextConfig;
