# Handlebars Preview for Visual Studio Code

Live preview for your Handlebars templates. Extension compiles Handlebars template on the fly, apply preview data and render resulting HTML in separate window.

Requires Visual Studio Code 1.125.0 or newer.
Runs in VS Code desktop, remote workspaces, and VS Code for the Web.

## Features

- Live preview for Handlebars templates. Preview updates as you type.
- Support for fake data. Add file `yourtemplate.handlebars.json` to be a context of the template.
- Configurable preview data suffix through `handlebarsPreview.dataFileSuffix`.
- Contributes `.handlebars` and `.hbs` language recognition.
- Support for partials selected from the command palette.
- Support for local `@font-face` fonts referenced from the template directory.
- Preview webviews run with scripts disabled and a restrictive content security policy.

## Example

<img src="https://raw.githubusercontent.com/chaliy/vscode-handlebars-preview/master/docs/usage.gif" alt="demo" style="width:480px;"/>

## Usage

- Use the keybinding `ctrl+k h`.
- To run from the command palette, use `ctrl+shift+p` and type `Handlebars: Open Preview`.
- By default, preview data is read from the template file name plus `.json`, such as `email.handlebars.json`.
- To register partials for preview rendering, run `Handlebars: Load Partials` and select one or more partial files. Each partial is available by its file basename.
- Local font files referenced from inline styles, `<style>` blocks, local stylesheet links, or local CSS imports can load when they are inside the template directory. Supported font file extensions are `.woff`, `.woff2`, `.ttf`, `.otf`, and `.eot`.

## Credits

- [Handlebars.js: Minimal Templating on Steroids](http://handlebarsjs.com/)
- [Handlebars for Visual Studio Code](https://marketplace.visualstudio.com/items?itemName=andrejunges.Handlebars)
- [A HTML previewer for Visual Studio Code](https://marketplace.visualstudio.com/items?itemName=tht13.html-preview-vscode)

## License

MIT
