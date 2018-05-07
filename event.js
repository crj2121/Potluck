function add_item(){
	event.preventDefault();
	var listContainer = $('#list');
	inputValue = $('#input').val();

    // add new list item
    listContainer.prepend('<li> ' + inputValue + '</li>');
    // clear value input
    $('#input').val('');
}

function add_comment(){
	event.preventDefault();
	var listContainer = $('#Eventlist');
	inputValue = $('#eventC').val();

    // add new list item
    listContainer.prepend('<li> ' + inputValue + '</li>');
    // clear value input
    $('#eventC').val('');
}