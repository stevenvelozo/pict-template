/*
	Unit tests for Pict Template
*/

const Chai = require('chai');
const Expect = Chai.expect;

const libPict = require('pict');
const libPictTemplateBase = require(`../source/Pict-Template.js`);

class testTemplateNonce extends libPictTemplateBase
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);

		this.addPattern('0', '0');
	}
}


class testTemplate extends libPictTemplateBase
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);

		this.addPattern('{{', '}}');
	}

	render(pTemplateHash, pRecord, pContextArray)
	{
		return 'THIS TEMPLATE MUSTACHE YOU SOME QUESTIONS';
	}
}

class testTemplateWithContext extends libPictTemplateBase
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);

		this.addPattern('{{', '}}');
	}

	render(pTemplateHash, pRecord, pContextArray)
	{
		let tmpValue = this.resolveStateFromAddress(pTemplateHash, pRecord, pContextArray);
		return `WE GOT ${tmpValue} WHILE PARSING YOUR TEMPLATE`;
	}
}

suite
(
	'Pict Template Basic Tests',
	() =>
	{
		setup(() => { });

		suite
			(
				'Basic Template Tests',
				() =>
				{
					test(
							'Add a Template that does nothing',
							(fDone) =>
							{
								let _Pict = new libPict();
								let _PictEnvironment = new libPict.EnvironmentLog(_Pict);
								let _PictTemplate = _Pict.addTemplate(testTemplateNonce);
								Expect(_PictTemplate).to.be.an('object');
								Expect(_Pict.parseTemplate('00')).to.equal('');
								return fDone();
							}
						);
					test(
							'Add a Template that does nothing and ask it to do nothing',
							(fDone) =>
							{
								let _Pict = new libPict();
								let _PictEnvironment = new libPict.EnvironmentLog(_Pict);
								let _PictTemplate = _Pict.addTemplate(testTemplate);
								let testResult = _Pict.parseTemplate('Tell me your message in your language... {{message}}', { message: 'Hello, World!' });
								Expect(testResult).to.equal('Tell me your message in your language... THIS TEMPLATE MUSTACHE YOU SOME QUESTIONS');
								return fDone();
							}
						);
					test(
							'Add a Template that does nothing and ask it to do nothing asynchronously',
							(fDone) =>
							{
								let _Pict = new libPict();
								let _PictEnvironment = new libPict.EnvironmentLog(_Pict);
								let _PictTemplate = _Pict.addTemplate(testTemplateWithContext);
								let testResult = _Pict.parseTemplate('Tell me your message in your language... {{Record.message}}', { message: 'Hello, World!' });
								Expect(testResult).to.equal('Tell me your message in your language... WE GOT Hello, World! WHILE PARSING YOUR TEMPLATE');

								// This string doesn't use "Record" to dereference the value passed in so it will return undefined.
								_Pict.parseTemplate(
									'Tell me your message in your language... {{message}}',
									{ message: 'Hello, World!' },
									(pError, pResult) =>
									{
										Expect(pError).to.be.undefined;
										Expect(pResult).to.equal('Tell me your message in your language... WE GOT undefined WHILE PARSING YOUR TEMPLATE');
										return fDone();
									}
								);
							}
						);
					test(
							'Add a Template that does nothing and ask it to do nothing with context',
							(fDone) =>
							{
								let _Pict = new libPict();
								let _PictEnvironment = new libPict.EnvironmentLog(_Pict);
								let _PictTemplate = _Pict.addTemplate(testTemplateWithContext);
								let testResult = _Pict.parseTemplate('Tell me your message in your language... {{message}}', { message: 'Hello, World!' });
								Expect(testResult).to.equal('Tell me your message in your language... WE GOT undefined WHILE PARSING YOUR TEMPLATE');
								return fDone();
							}
						);
					test(
							'Test context array',
							(fDone) =>
							{
								let _Pict = new libPict();
								let _PictEnvironment = new libPict.EnvironmentLog(_Pict);
								let _PictTemplate = _Pict.addTemplate(testTemplateWithContext);
								let testResult = _Pict.parseTemplate('Tell me your message in your language... {{Context[0].OtherData}}', { message: 'Hello, World!' }, null, [ {OtherData:'Good stuff.'} ]);
								Expect(testResult).to.equal('Tell me your message in your language... WE GOT Good stuff. WHILE PARSING YOUR TEMPLATE');
								return fDone();
							}
						);
				}
			);
	}
);