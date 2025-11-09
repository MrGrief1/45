# Building FlashSearch

1. Install dependencies:
   ```bash
   npm install
   ```
2. Run the development build if you want to test in Electron:
   ```bash
   npm start
   ```
3. Create a distributable Windows installer (x64):
   ```bash
   npm run dist
   ```
   The installer and unpacked build artifacts are written to the `dist/` directory.

## Packaging & Code Protection
- Distribution builds are bundled into an [ASAR](https://www.electronjs.org/docs/latest/tutorial/application-packaging#generating-asar-archives), which keeps source files inside a single archive to discourage casual tampering.
- The installer is compressed with maximum settings to make the output smaller and less trivial to modify.
- For additional hardening you can run your own JavaScript obfuscation step before invoking `npm run dist`, but keep in mind that any shipped client-side code can eventually be reverse engineered by a determined adversary.
