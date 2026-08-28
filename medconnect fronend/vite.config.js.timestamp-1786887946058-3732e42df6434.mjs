// vite.config.js
import { defineConfig } from "file:///D:/projects/medconnect/node_modules/vite/dist/node/index.js";
import react from "file:///D:/projects/medconnect/node_modules/@vitejs/plugin-react/dist/index.js";
import path from "path";
var __vite_injected_original_dirname = "D:\\projects\\medconnect";
var vite_config_default = defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  server: {
    port: 3e3,
    open: true,
    // Proxy API calls to the Spring Boot backend to avoid CORS issues in dev
    // HTML requests (page refreshes) are bypassed to index.html so React Router works
    proxy: {
      "/auth": {
        target: "http://localhost:8081",
        changeOrigin: true,
        secure: false,
        bypass: (req) => req.headers.accept?.includes("text/html") ? "/index.html" : void 0
      },
      "/hospital": {
        target: "http://localhost:8082",
        changeOrigin: true,
        secure: false,
        bypass: (req) => req.headers.accept?.includes("text/html") ? "/index.html" : void 0
      },
      "/doctor": {
        target: "http://localhost:8082",
        changeOrigin: true,
        secure: false,
        bypass: (req) => req.headers.accept?.includes("text/html") ? "/index.html" : void 0
      },
      "/patients": {
        target: "http://localhost:8082",
        changeOrigin: true,
        secure: false,
        bypass: (req) => req.headers.accept?.includes("text/html") ? "/index.html" : void 0
      },
      "/appointments": {
        target: "http://localhost:8082",
        changeOrigin: true,
        secure: false,
        bypass: (req) => req.headers.accept?.includes("text/html") ? "/index.html" : void 0
      },
      "/prescription": {
        target: "http://localhost:8082",
        changeOrigin: true,
        secure: false,
        bypass: (req) => req.headers.accept?.includes("text/html") ? "/index.html" : void 0
      },
      "/medical-record": {
        target: "http://localhost:8082",
        changeOrigin: true,
        secure: false,
        bypass: (req) => req.headers.accept?.includes("text/html") ? "/index.html" : void 0
      },
      "/notifications": {
        target: "http://localhost:8082",
        changeOrigin: true,
        secure: false,
        bypass: (req) => req.headers.accept?.includes("text/html") ? "/index.html" : void 0
      },
      "/reviews": {
        target: "http://localhost:8082",
        changeOrigin: true,
        secure: false,
        bypass: (req) => req.headers.accept?.includes("text/html") ? "/index.html" : void 0
      },
      "/blog": {
        target: "http://localhost:8082",
        changeOrigin: true,
        secure: false,
        bypass: (req) => req.headers.accept?.includes("text/html") ? "/index.html" : void 0
      },
      "/payments": {
        target: "http://localhost:8082",
        changeOrigin: true,
        secure: false,
        bypass: (req) => req.headers.accept?.includes("text/html") ? "/index.html" : void 0
      },
      "/billing": {
        target: "http://localhost:8082",
        changeOrigin: true,
        secure: false,
        bypass: (req) => req.headers.accept?.includes("text/html") ? "/index.html" : void 0
      },
      "/invoice": {
        target: "http://localhost:8082",
        changeOrigin: true,
        secure: false,
        bypass: (req) => req.headers.accept?.includes("text/html") ? "/index.html" : void 0
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          charts: ["recharts"],
          ui: ["@headlessui/react", "@heroicons/react"]
        }
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxwcm9qZWN0c1xcXFxtZWRjb25uZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJEOlxcXFxwcm9qZWN0c1xcXFxtZWRjb25uZWN0XFxcXHZpdGUuY29uZmlnLmpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9EOi9wcm9qZWN0cy9tZWRjb25uZWN0L3ZpdGUuY29uZmlnLmpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSAndml0ZSdcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCdcbmltcG9ydCBwYXRoIGZyb20gJ3BhdGgnXG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIHBsdWdpbnM6IFtyZWFjdCgpXSxcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICAnQCc6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsICcuL3NyYycpLFxuICAgIH0sXG4gIH0sXG4gIHNlcnZlcjoge1xuICAgIHBvcnQ6IDMwMDAsXG4gICAgb3BlbjogdHJ1ZSxcbiAgICAvLyBQcm94eSBBUEkgY2FsbHMgdG8gdGhlIFNwcmluZyBCb290IGJhY2tlbmQgdG8gYXZvaWQgQ09SUyBpc3N1ZXMgaW4gZGV2XG4gICAgLy8gSFRNTCByZXF1ZXN0cyAocGFnZSByZWZyZXNoZXMpIGFyZSBieXBhc3NlZCB0byBpbmRleC5odG1sIHNvIFJlYWN0IFJvdXRlciB3b3Jrc1xuICAgIHByb3h5OiB7XG4gICAgICAnL2F1dGgnOiB7XG4gICAgICAgIHRhcmdldDogJ2h0dHA6Ly9sb2NhbGhvc3Q6ODA4MScsXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcbiAgICAgICAgc2VjdXJlOiBmYWxzZSxcbiAgICAgICAgYnlwYXNzOiAocmVxKSA9PiByZXEuaGVhZGVycy5hY2NlcHQ/LmluY2x1ZGVzKCd0ZXh0L2h0bWwnKSA/ICcvaW5kZXguaHRtbCcgOiB1bmRlZmluZWQsXG4gICAgICB9LFxuICAgICAgJy9ob3NwaXRhbCc6IHtcbiAgICAgICAgdGFyZ2V0OiAnaHR0cDovL2xvY2FsaG9zdDo4MDgyJyxcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxuICAgICAgICBzZWN1cmU6IGZhbHNlLFxuICAgICAgICBieXBhc3M6IChyZXEpID0+IHJlcS5oZWFkZXJzLmFjY2VwdD8uaW5jbHVkZXMoJ3RleHQvaHRtbCcpID8gJy9pbmRleC5odG1sJyA6IHVuZGVmaW5lZCxcbiAgICAgIH0sXG4gICAgICAnL2RvY3Rvcic6IHtcbiAgICAgICAgdGFyZ2V0OiAnaHR0cDovL2xvY2FsaG9zdDo4MDgyJyxcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxuICAgICAgICBzZWN1cmU6IGZhbHNlLFxuICAgICAgICBieXBhc3M6IChyZXEpID0+IHJlcS5oZWFkZXJzLmFjY2VwdD8uaW5jbHVkZXMoJ3RleHQvaHRtbCcpID8gJy9pbmRleC5odG1sJyA6IHVuZGVmaW5lZCxcbiAgICAgIH0sXG4gICAgICAnL3BhdGllbnRzJzoge1xuICAgICAgICB0YXJnZXQ6ICdodHRwOi8vbG9jYWxob3N0OjgwODInLFxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICAgIHNlY3VyZTogZmFsc2UsXG4gICAgICAgIGJ5cGFzczogKHJlcSkgPT4gcmVxLmhlYWRlcnMuYWNjZXB0Py5pbmNsdWRlcygndGV4dC9odG1sJykgPyAnL2luZGV4Lmh0bWwnIDogdW5kZWZpbmVkLFxuICAgICAgfSxcbiAgICAgICcvYXBwb2ludG1lbnRzJzoge1xuICAgICAgICB0YXJnZXQ6ICdodHRwOi8vbG9jYWxob3N0OjgwODInLFxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICAgIHNlY3VyZTogZmFsc2UsXG4gICAgICAgIGJ5cGFzczogKHJlcSkgPT4gcmVxLmhlYWRlcnMuYWNjZXB0Py5pbmNsdWRlcygndGV4dC9odG1sJykgPyAnL2luZGV4Lmh0bWwnIDogdW5kZWZpbmVkLFxuICAgICAgfSxcbiAgICAgICcvcHJlc2NyaXB0aW9uJzoge1xuICAgICAgICB0YXJnZXQ6ICdodHRwOi8vbG9jYWxob3N0OjgwODInLFxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICAgIHNlY3VyZTogZmFsc2UsXG4gICAgICAgIGJ5cGFzczogKHJlcSkgPT4gcmVxLmhlYWRlcnMuYWNjZXB0Py5pbmNsdWRlcygndGV4dC9odG1sJykgPyAnL2luZGV4Lmh0bWwnIDogdW5kZWZpbmVkLFxuICAgICAgfSxcbiAgICAgICcvbWVkaWNhbC1yZWNvcmQnOiB7XG4gICAgICAgIHRhcmdldDogJ2h0dHA6Ly9sb2NhbGhvc3Q6ODA4MicsXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcbiAgICAgICAgc2VjdXJlOiBmYWxzZSxcbiAgICAgICAgYnlwYXNzOiAocmVxKSA9PiByZXEuaGVhZGVycy5hY2NlcHQ/LmluY2x1ZGVzKCd0ZXh0L2h0bWwnKSA/ICcvaW5kZXguaHRtbCcgOiB1bmRlZmluZWQsXG4gICAgICB9LFxuICAgICAgJy9ub3RpZmljYXRpb25zJzoge1xuICAgICAgICB0YXJnZXQ6ICdodHRwOi8vbG9jYWxob3N0OjgwODInLFxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICAgIHNlY3VyZTogZmFsc2UsXG4gICAgICAgIGJ5cGFzczogKHJlcSkgPT4gcmVxLmhlYWRlcnMuYWNjZXB0Py5pbmNsdWRlcygndGV4dC9odG1sJykgPyAnL2luZGV4Lmh0bWwnIDogdW5kZWZpbmVkLFxuICAgICAgfSxcbiAgICAgICcvcmV2aWV3cyc6IHtcbiAgICAgICAgdGFyZ2V0OiAnaHR0cDovL2xvY2FsaG9zdDo4MDgyJyxcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxuICAgICAgICBzZWN1cmU6IGZhbHNlLFxuICAgICAgICBieXBhc3M6IChyZXEpID0+IHJlcS5oZWFkZXJzLmFjY2VwdD8uaW5jbHVkZXMoJ3RleHQvaHRtbCcpID8gJy9pbmRleC5odG1sJyA6IHVuZGVmaW5lZCxcbiAgICAgIH0sXG4gICAgICAnL2Jsb2cnOiB7XG4gICAgICAgIHRhcmdldDogJ2h0dHA6Ly9sb2NhbGhvc3Q6ODA4MicsXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcbiAgICAgICAgc2VjdXJlOiBmYWxzZSxcbiAgICAgICAgYnlwYXNzOiAocmVxKSA9PiByZXEuaGVhZGVycy5hY2NlcHQ/LmluY2x1ZGVzKCd0ZXh0L2h0bWwnKSA/ICcvaW5kZXguaHRtbCcgOiB1bmRlZmluZWQsXG4gICAgICB9LFxuICAgICAgJy9wYXltZW50cyc6IHtcbiAgICAgICAgdGFyZ2V0OiAnaHR0cDovL2xvY2FsaG9zdDo4MDgyJyxcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxuICAgICAgICBzZWN1cmU6IGZhbHNlLFxuICAgICAgICBieXBhc3M6IChyZXEpID0+IHJlcS5oZWFkZXJzLmFjY2VwdD8uaW5jbHVkZXMoJ3RleHQvaHRtbCcpID8gJy9pbmRleC5odG1sJyA6IHVuZGVmaW5lZCxcbiAgICAgIH0sXG4gICAgICAnL2JpbGxpbmcnOiB7XG4gICAgICAgIHRhcmdldDogJ2h0dHA6Ly9sb2NhbGhvc3Q6ODA4MicsXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcbiAgICAgICAgc2VjdXJlOiBmYWxzZSxcbiAgICAgICAgYnlwYXNzOiAocmVxKSA9PiByZXEuaGVhZGVycy5hY2NlcHQ/LmluY2x1ZGVzKCd0ZXh0L2h0bWwnKSA/ICcvaW5kZXguaHRtbCcgOiB1bmRlZmluZWQsXG4gICAgICB9LFxuICAgICAgJy9pbnZvaWNlJzoge1xuICAgICAgICB0YXJnZXQ6ICdodHRwOi8vbG9jYWxob3N0OjgwODInLFxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICAgIHNlY3VyZTogZmFsc2UsXG4gICAgICAgIGJ5cGFzczogKHJlcSkgPT4gcmVxLmhlYWRlcnMuYWNjZXB0Py5pbmNsdWRlcygndGV4dC9odG1sJykgPyAnL2luZGV4Lmh0bWwnIDogdW5kZWZpbmVkLFxuICAgICAgfSxcbiAgICB9LFxuICB9LFxuICBidWlsZDoge1xuICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgIG91dHB1dDoge1xuICAgICAgICBtYW51YWxDaHVua3M6IHtcbiAgICAgICAgICB2ZW5kb3I6IFsncmVhY3QnLCAncmVhY3QtZG9tJywgJ3JlYWN0LXJvdXRlci1kb20nXSxcbiAgICAgICAgICBjaGFydHM6IFsncmVjaGFydHMnXSxcbiAgICAgICAgICB1aTogWydAaGVhZGxlc3N1aS9yZWFjdCcsICdAaGVyb2ljb25zL3JlYWN0J10sXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0sXG4gIH0sXG59KSJdLAogICJtYXBwaW5ncyI6ICI7QUFBMFAsU0FBUyxvQkFBb0I7QUFDdlIsT0FBTyxXQUFXO0FBQ2xCLE9BQU8sVUFBVTtBQUZqQixJQUFNLG1DQUFtQztBQUl6QyxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTLENBQUMsTUFBTSxDQUFDO0FBQUEsRUFDakIsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsS0FBSyxLQUFLLFFBQVEsa0NBQVcsT0FBTztBQUFBLElBQ3RDO0FBQUEsRUFDRjtBQUFBLEVBQ0EsUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sTUFBTTtBQUFBO0FBQUE7QUFBQSxJQUdOLE9BQU87QUFBQSxNQUNMLFNBQVM7QUFBQSxRQUNQLFFBQVE7QUFBQSxRQUNSLGNBQWM7QUFBQSxRQUNkLFFBQVE7QUFBQSxRQUNSLFFBQVEsQ0FBQyxRQUFRLElBQUksUUFBUSxRQUFRLFNBQVMsV0FBVyxJQUFJLGdCQUFnQjtBQUFBLE1BQy9FO0FBQUEsTUFDQSxhQUFhO0FBQUEsUUFDWCxRQUFRO0FBQUEsUUFDUixjQUFjO0FBQUEsUUFD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
