import * as Handlebars from "handlebars";

import { registerBuiltinHelpers } from "./builtinHelpers";
import { HelperRegistrations, registerHelpers } from "./helpers";

export type Partials = Record<string, string>;

function escapeHtml(value: unknown): string {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

export default (
    templateSource: string,
    dataSource?: string | null,
    partials: Partials = {},
    helpers?: HelperRegistrations,
    helperLoadError?: unknown
): string => {
    if (!templateSource) {
        return "<p>Select document to render</p>";
    }

    try {
        if (helperLoadError) {
            throw helperLoadError;
        }

        const data = JSON.parse(dataSource || "{}");
        const handlebars = Handlebars.create();
        registerBuiltinHelpers(handlebars);

        Object.entries(partials).forEach(([name, content]) => {
            handlebars.registerPartial(name, content);
        });

        if (helpers) {
            registerHelpers(handlebars, helpers);
        }

        const template = handlebars.compile(templateSource);
        return template(data);
    } catch (ex) {
        return `
            <h2>Error occurred</h2>
            <pre>${escapeHtml(ex)}</pre>
        `;
    }
};
