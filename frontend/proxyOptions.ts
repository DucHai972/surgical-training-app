import common_site_config from '../../../sites/common_site_config.json';
const { webserver_port } = common_site_config;

export default {
	// Exclude the frontend development path from being proxied
	'^/(?!assets/surgical_training/frontend)(app|api|assets|files|private)': {
		target: `http://127.0.0.1:${webserver_port}`,
		ws: true,
		changeOrigin: true,
		secure: false,
		router: function(req) {
			// Always use localhost for development to avoid DNS issues
			return `http://localhost:${webserver_port}`;
		},
		onProxyReq: (proxyReq, req, res) => {
			// Set Host header to match target
			proxyReq.setHeader('Host', `localhost:${webserver_port}`);
		}
	}
};
