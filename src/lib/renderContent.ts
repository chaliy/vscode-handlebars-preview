import * as Handlebars from "handlebars";

export default (templateSource: string, dataSource: any, partials?: {[key: string]: string}): string => {
    if (!templateSource) {
        return "<body>Select document to render</body>";
    }

    if (partials) {
        Object.entries(partials).forEach(([name, content]) => {
            Handlebars.registerPartial(name, content);
        });
    }

    try {
        let data = JSON.parse(dataSource || "{}");
        let template = Handlebars.compile(templateSource);
        return template(data);
    } catch (ex) {
        return `
            <body>
                <h2>Error occured</h2>
                <pre>${ex}</pre>
            </body>
        `;
    }
};
