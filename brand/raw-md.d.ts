// Vite raw text imports for versioned brand prompt files.
declare module "*.md?raw" {
  const content: string;
  export default content;
}
