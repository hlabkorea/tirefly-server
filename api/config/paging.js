function getPageInfo(page, totalPost, maxPost){
	var maxPage = 100;
    var currentPage = page ? parseInt(page) : 1;
    const totalPage = Math.ceil(totalPost / maxPost);
    const startPage = Math.floor((currentPage - 1) / maxPage) * maxPage + 1; 
    var endPage = startPage + maxPage - 1;

    if(endPage > totalPage)
        endPage = totalPage;

    return {startPage, endPage, totalPage};
}

module.exports = {getPageInfo};