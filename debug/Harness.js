const libPict = require('pict');

const libPictTemplateBase = require('../source/Pict-Template.js');

class harnessTemplate extends libPictTemplateBase
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);
		this.addPattern('{{', '}}');
	}

	render(pTemplateHash, pRecord, pContextArray)
	{
		let tmpValue = this.resolveStateFromAddress(pTemplateHash, pRecord, pContextArray);
		tmpValue = (tmpValue ? tmpValue : '')
		return `mustache[${tmpValue}]`;
	}
}

// Instantiate pict
const _Pict = new libPict({Product:'Tp'});

// Add the template
_Pict.addTemplate(harnessTemplate);

// Process a string with our template in it
_Pict.log.info(_Pict.parseTemplate('The new style is a {{Record.test}}', {test: 'test'}));

// Or maybe asynchonously
_Pict.parseTemplate('The new style is a {{Record.test}}', 
	{
		test: 'asynctest'
	},
	(pError, pResult) =>
	{
		_Pict.log.info(pResult);
	});

// Or even async with a custom base context!!
_Pict.parseTemplate('The new style is a {{Record.test}} with context like {{Context[0].base}}', 
	{
		test: 'asynctest'
	},
	(pError, pResult) =>
	{
		_Pict.log.info(pResult);
	},
	[{
		'base': 'foundational'
	}]);