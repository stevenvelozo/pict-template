const libFableServiceBase = require('fable-serviceproviderbase');

const libPackage = require('../package.json');

/** @typedef {import('pict') & {
 *     [key: string]: any, // represent services for now as a workaround
 * }} Pict */
/**
 * @class PictTemplateExpression
 * @classdesc The PictTemplateExpression class is a service provider for the pict anti-framework that provides template rendering services.
 */
class PictTemplateExpression extends libFableServiceBase
{
	/**
	 * @param {Pict} pFable - The Fable Framework instance
	 * @param {Record<string, any>} [pOptions] - The options for the service
	 * @param {string} [pServiceHash] - The hash of the service
	 */
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);

		/** @type {Pict} */
		this.fable;

		/** @type {Pict} */
		this.pict = this.fable;

		this.serviceType = 'PictTemplate';
		/** @type {Record<string, any>} */
		this._Package = libPackage;
	}

	/**
	 * Render a template expression, returning a string with the resulting content.
	 *
	 * @param {string} pTemplateHash - The hash contents of the template (what's between the template start and stop tags)
	 * @param {any} pRecord - The json object to be used as the Record for the template render
	 * @param {Array<any>} pContextArray - An array of context objects accessible from the template; safe to leave empty
	 *
	 * @return {string} The rendered template
	 */
	render(pTemplateHash, pRecord, pContextArray)
	{
		return '';
	}

	/**
	 * Render a template expression, deliver a string with the resulting content to a callback function.
	 *
	 * @param {string} pTemplateHash - The hash contents of the template (what's between the template start and stop tags)
	 * @param {any} pRecord - The json object to be used as the Record for the template render
	 * @param {Array<any>} pContextArray - An array of context objects accessible from the template; safe to leave empty
	 * @param {(error?: Error, content?: String) => void} fCallback - callback function invoked with the rendered template, or an error
	 *
	 * @return {void}
	 */
	renderAsync(pTemplateHash, pRecord, fCallback, pContextArray)
	{
		return fCallback(null, this.render(pTemplateHash, pRecord, pContextArray));
	}

	/**
	 * Provide a match criteria for a template expression.  Anything between these two values is returned as the template hash.
	 *
	 * @param {string} pMatchStart - The string pattern to start a match in the template trie
	 * @param {string} pMatchEnd  - The string pattern to stop a match in the trie acyclic graph
	 *
	 * @return {void}
	 */
	addPattern(pMatchStart, pMatchEnd)
	{
		return this.pict.MetaTemplate.addPatternBoth(pMatchStart, pMatchEnd, this.render, this.renderAsync, this);
	}

	/**
	 * Read a value from a nested object using a dot notation string.
	 *
	 * @param {string} pAddress - The address to resolve
	 * @param {Record<string, any>} pRecord - The record to resolve
	 * @param {Array<any>} [pContextArray] - The context array to resolve (optional)
	 * @param {Record<string, any>} [pRootDataObject] - The root data object to resolve (optional)
	 *
	 * @return {any} The value at the given address, or undefined
	 */
	resolveStateFromAddress(pAddress, pRecord, pContextArray, pRootDataObject)
	{
		let tmpContextArray = (Array.isArray(pContextArray)) ? pContextArray : [ this.pict ];
		let tmpRootDataObject = (typeof(pRootDataObject) === 'object') ? pRootDataObject : {};

		tmpRootDataObject.Fable = this.pict;
		tmpRootDataObject.Pict = this.pict;
		tmpRootDataObject.AppData = this.pict.AppData;
		tmpRootDataObject.Bundle = this.pict.Bundle;
		tmpRootDataObject.Context = tmpContextArray;
		tmpRootDataObject.Record = pRecord;

		return this.pict.manifest.getValueByHash(tmpRootDataObject, pAddress);
	}
}

module.exports = PictTemplateExpression;
module.exports.template_hash = 'Default';
