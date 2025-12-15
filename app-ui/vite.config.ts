import { fileURLToPath, URL } from 'node:url';
import type { Plugin } from 'vite';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { ViteMinifyPlugin } from 'vite-plugin-minify';
import { visualizer } from 'rollup-plugin-visualizer';
import path from 'node:path';
import * as fs from 'node:fs';
import minify from 'minify-xml';
import { JSDOM } from 'jsdom';
import vueDevTools from 'vite-plugin-vue-devtools';
import Inspector from 'unplugin-vue-inspector/vite';
import Inspect from 'vite-plugin-inspect';
import postcss from 'postcss';
import cssnano from 'cssnano';

//https://vueschool.io/articles/vuejs-tutorials/7-awesome-vue-js-3-plugins-and-libraries-to-know-in-2023/
//https://vuejs.org/guide/built-ins/transition-group.html#staggering-list-transitions
//gsap https://greensock.com/docs/v3/Installation
function svgMinification(): Plugin {
    return {
        name: 'svg-minification',
        apply: 'build',
        generateBundle() {
            const absPath = path.resolve('src/assets/icon-interactive.svg');
            const distPath = path.resolve('src/assets/icon-interactive.svg');
            if (fs.existsSync(absPath)) {
                const originalContent = fs.readFileSync(absPath, 'utf-8');
                const newContent = minify(originalContent);
                fs.mkdirSync(path.dirname(distPath), { recursive: true });
                fs.writeFileSync(distPath, newContent, 'utf-8');
                this.info(`✅  Minified SVG file: ${absPath}`);
            } else {
                this.info(`✅  File not found: ${absPath}`);
            }
        },
    };
}

function indexHandler(): Plugin {
    let apihostPort: string;
    let envMode: string;
    let version: string;

    return {
        name: 'index-handler',
        apply: 'build',
        configResolved(config) {
            apihostPort = new URL(config.env.VITE_API_URL).origin;
            envMode = config.env.MODE;
            version = config.env.VITE_APP_VERSION;
        },
        transformIndexHtml(html) {
            this.info(` ✅  API Host: ${apihostPort}`);
            this.info(` ✅  Environment Mode: ${envMode}`);
            this.info(` ✅  App Version: ${version}`);

            const dom = new JSDOM(html);
            const document = dom.window.document;

            const apiHostLink = document.createElement('link');
            apiHostLink.rel = 'preconnect';
            apiHostLink.href = apihostPort;
            document.head.appendChild(apiHostLink);

            const moduleScript = Array.from(document.scripts).find(
                (script) => script.type === 'module',
            );
            moduleScript?.setAttribute('defer', '');

            const deploymentInfo = document.getElementById('deployment-info');
            deploymentInfo!.textContent = `Version: ${version} | Environment: ${envMode}`;

            return dom.serialize();
        },
    };
}

function inlineCriticalCssPlugin(criticalCss: string[]): Plugin {
    return {
        name: 'inline-critical-css-plugin',
        apply: 'build',
        async closeBundle() {
            const criticalCssSet = new Set(criticalCss);
            const distDir = path.resolve('dist');
            const htmlPath = path.join(distDir, 'index.html');

            try {
                let html = fs.readFileSync(htmlPath, 'utf-8');

                // Find all <link> tags that reference /assets/*.css
                const linkRegex = /<link\s+[^>]*href=["']\/([^"']+\.css)["'][^>]*>/gi;
                const matches = [...html.matchAll(linkRegex)];

                for (const match of matches) {
                    const fullMatch = match[0];
                    const cssFile = match[1];
                    const cssPath = path.join(distDir, cssFile);
                    if (!criticalCssSet.has(cssFile)) continue;

                    try {
                        const css = fs.readFileSync(cssPath, 'utf-8');
                        const result = await postcss([cssnano]).process(css, { from: undefined });
                        html = html.replace(fullMatch, `<style>${result.css}</style>`);
                        this.info(`✅  Inlined ${cssFile}`);
                        fs.rmSync(cssPath);
                        this.info(`🗑️ ${cssPath} removed after inlining`);
                    } catch (err) {
                        this.error(`⚠️  Failed to inline ${cssFile}: ${(err as Error).message}`);
                    }
                }

                fs.writeFileSync(htmlPath, html, 'utf-8');

                this.info(`✅  Inlined ${matches.length} CSS file(s) into index.html`);
            } catch (err) {
                this.error(`⚠️ Inline CSS plugin error: ${(err as Error).message}`);
            }
        },
    };
}

export default defineConfig(({ mode }) => {
    const isDev = mode === 'dev';
    return {
        define: {
            __VUE_OPTIONS_API__: false,
        },
        plugins: [
            vue(),
            ViteMinifyPlugin(),
            isDev && vueDevTools(),

            isDev &&
                Inspector({
                    enabled: true,
                    toggleButtonVisibility: 'always',
                    toggleButtonPos: 'top-right',
                    launchEditor: 'webstorm',
                }),
            isDev && Inspect(),
            visualizer({
                projectRoot: './dist',
                filename: './bundle-analysis.html', // Output file
                open: false, // Automatically open report in browser
                brotliSize: true,
                template: 'network',
            }),
            svgMinification(),
            indexHandler(),
            inlineCriticalCssPlugin([
                'styles/settings.css',
                'styles/generic.css',
                'styles/common.css',
                'styles/main.css',
            ]),
        ].filter(Boolean),
        base: '/',
        resolve: {
            alias: {
                '@': fileURLToPath(new URL('./src', import.meta.url)),
            },
        },
    };
});
