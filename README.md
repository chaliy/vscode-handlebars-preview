# Handlebars Preview for Visual Studio Code

Live preview for your Handlebars templates. Extension compiles Handlebars template on the fly, apply preview data and render resulting HTML in separate window.

Requires Visual Studio Code 1.125.0 or newer.

## Features

- Live preview for Handlebars templates. Preview updates as you type.
- Support for fake data. Add file `yourtemplate.handlebars.json` to be a context of the template
- Preview webviews run with scripts disabled and a restrictive content security policy.

## Example

<img src="https://raw.githubusercontent.com/chaliy/vscode-handlebars-preview/master/docs/usage.gif" alt="demo" style="width:480px;"/>

## Usage

- Use the keybinding `ctrl+k h`.
- To run from the command palette, use `ctrl+shift+p` and type `Handlebars: Open Preview`.

## Credits

- [Handlebars.js: Minimal Templating on Steroids](http://handlebarsjs.com/)
- [Handlebars for Visual Studio Code](https://marketplace.visualstudio.com/items?itemName=andrejunges.Handlebars)
- [A HTML previewer for Visual Studio Code](https://marketplace.visualstudio.com/items?itemName=tht13.html-preview-vscode)

## License

MIT
