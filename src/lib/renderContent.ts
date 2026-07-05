import * as Handlebars from "handlebars";

export type Partials = Record<string, string>;

function escapeHtml(value: unknown): string {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

export default (templateSource: string, dataSource?: string | null, partials: Partials = {}): string => {
    if (!templateSource) {
        return "<p>Select document to render</p>";
    }

    try {
        const data = JSON.parse(dataSource || "{}");
        const handlebars = Handlebars.create();

        Object.entries(partials).forEach(([name, content]) => {
            handlebars.registerPartial(name, content);
        });

        const template = handlebars.compile(templateSource);
        return template(data);
    } catch (ex) {
        return `
            <h2>Error occurred</h2>
            <pre>${escapeHtml(ex)}</pre>
        `;
    }
};
