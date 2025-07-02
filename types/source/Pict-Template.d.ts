export = PictTemplateExpression;
/** @typedef {import('pict') & {
 *     [key: string]: any, // represent services for now as a workaround
 * }} Pict */
/**
 * @class PictTemplateExpression
 * @classdesc The PictTemplateExpression class is a service provider for the pict anti-framework that provides template rendering services.
 */
declare class PictTemplateExpression {
    /**
     * @param {Pict} pFable - The Fable Framework instance
     * @param {Record<string, any>} [pOptions] - The options for the service
     * @param {string} [pServiceHash] - The hash of the service
     */
    constructor(pFable: Pict, pOptions?: Record<string, any>, pServiceHash?: string);
    /** @type {Pict} */
    fable: Pict;
    /** @type {Pict} */
    pict: Pict;
    serviceType: string;
    /** @type {Record<string, any>} */
    _Package: Record<string, any>;
    /**
     * Render a template expression, returning a string with the resulting content.
     *
     * @param {string} pTemplateHash - The hash contents of the template (what's between the template start and stop tags)
     * @param {any} pRecord - The json object to be used as the Record for the template render
     * @param {Array<any>} pContextArray - An array of context objects accessible from the template; safe to leave empty
     * @param {any} [pScope] - A sticky scope that can be used to carry state and simplify template
     *
     * @return {string} The rendered template
     */
    render(pTemplateHash: string, pRecord: any, pContextArray: Array<any>, pScope?: any): string;
    /**
     * Render a template expression, deliver a string with the resulting content to a callback function.
     *
     * @param {string} pTemplateHash - The hash contents of the template (what's between the template start and stop tags)
     * @param {any} pRecord - The json object to be used as the Record for the template render
     * @param {(error?: Error, content?: String) => void} fCallback - callback function invoked with the rendered template, or an error
     * @param {Array<any>} pContextArray - An array of context objects accessible from the template; safe to leave empty
     * @param {any} [pScope] - A sticky scope that can be used to carry state and simplify template
     *
     * @return {void}
     */
    renderAsync(pTemplateHash: string, pRecord: any, fCallback: (error?: Error, content?: string) => void, pContextArray: Array<any>, pScope?: any): void;
    /**
     * Provide a match criteria for a template expression.  Anything between these two values is returned as the template hash.
     *
     * @param {string} pMatchStart - The string pattern to start a match in the template trie
     * @param {string} pMatchEnd  - The string pattern to stop a match in the trie acyclic graph
     *
     * @return {void}
     */
    addPattern(pMatchStart: string, pMatchEnd: string): void;
    /**
     * Read a value from a nested object using a dot notation string.
     *
     * @param {string} pAddress - The address to resolve
     * @param {Record<string, any>} pRecord - The record to resolve
     * @param {Array<any>} [pContextArray] - The context array to resolve (optional)
     * @param {Record<string, any>} [pRootDataObject] - The root data object to resolve (optional)
     * @param {any} [pScope] - A sticky scope that can be used to carry state and simplify template
     *
     * @return {any} The value at the given address, or undefined
     */
    resolveStateFromAddress(pAddress: string, pRecord: Record<string, any>, pContextArray?: Array<any>, pRootDataObject?: Record<string, any>, pScope?: any): any;
}
declare namespace PictTemplateExpression {
    export { template_hash, Pict };
}
declare const template_hash: "Default";
type Pict = import("pict") & {
    [key: string]: any;
};
//# sourceMappingURL=Pict-Template.d.ts.map