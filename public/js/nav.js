function getCategoryList(){
    fetch('/get-category-list',
        {
            method: 'POST'
        }
    ).then(function (response){
        return response.text();
        }
    ).then(function (body){
        console.log(body);
        showCategoryList(JSON.parse(body));
    })
}

function showCategoryList(data){
    console.log(data);
}

getCategoryList();