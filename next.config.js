/** @type {import('next').NextConfig} */
module.exports = {
  eslint: {
    ignoreDuringBuilds: true
  },
  experimental: {
    // Prevent webpack from bundling native Node packages used only in API routes
    serverComponentsExternalPackages: ['@xenova/transformers', 'onnxruntime-node', 'onnxruntime-common']
  },
  webpack(config, { isServer }) {
    if (isServer) {
      // Keep .node native binaries as externals
      config.externals = [
        ...(Array.isArray(config.externals) ? config.externals : []),
        function({ request }, callback) {
          if (request && request.endsWith('.node')) {
            callback(null, 'commonjs ' + request);
          } else {
            callback();
          }
        }
      ];
    }
    config.resolve.alias = {
      ...config.resolve.alias,
      'onnxruntime-web': false
    };
    return config;
  },
  images: {
    remotePatterns: [
      // Unsplash (sample catalog images)
      {
        protocol: 'https',
        hostname: 'images.unsplash.com'
      },
      // Scaleway Object Storage — leathermart313 bucket (fr-par)
      {
        protocol: 'https',
        hostname: 'leathermart313.s3.fr-par.scw.cloud',
        pathname: '/**'
      },
      // Scaleway — any other bucket in fr-par (fallback)
      {
        protocol: 'https',
        hostname: '**.s3.fr-par.scw.cloud',
        pathname: '/**'
      },
      // Supabase Storage (public bucket images)
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/**'
      }
    ]
  },
  async redirects() {
    return [
      {
        source: '/password',
        destination: '/',
        permanent: true
      }
    ];
  }
};
