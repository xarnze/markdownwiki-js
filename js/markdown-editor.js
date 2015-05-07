markdownEditor = function(elem, settings){
	//TODO: create html
	//TODO: Create API
	$(elem).html('<textarea id="code"></textarea>');

	var editor = CodeMirror.fromTextArea(document.getElementById('code'), {
      mode: 'gfm',
      lineNumbers: false,
      matchBrackets: true,
      lineWrapping: true,
      theme: 'base16-light',
      extraKeys: {"Enter": "newlineAndIndentContinueMarkdownList"}
    });
};