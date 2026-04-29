/*
* Broadcast Theme
*
* Use this file to add custom Javascript to Broadcast.  Keeping your custom
* Javascript in this fill will make it easier to update Broadcast. In order
* to use this file you will need to open layout/theme.liquid and uncomment
* the custom.js script import line near the bottom of the file.
*/


(function() {
  // Add custom code below this line


  




  // ^^ Keep your scripts inside this IIFE function call to 
  // avoid leaking your variables into the global scope.
})();

function setItemsOnInit()
{
var giftProducts = document.querySelectorAll('.cart__item.giftProduct');
  for (var i=0; i< giftProducts.length; i++)
    {
      //giftProducts[i];
      var titleOfParent = giftProducts[i].querySelector('p.cart__item__property span');
      if(titleOfParent){
        
var titleOfParentText = titleOfParent.innerHTML;
var removeIT = true;
// now check if it exists
var allArrayItems = document.querySelectorAll('h4.cart__item__title a');
for (var j=0; j< allArrayItems.length; j++)
 {
var singleTextItem = allArrayItems[j].innerHTML;
if(singleTextItem == titleOfParentText)
{
  removeIT = false;
}
 } 

if(removeIT)
{
 var removeButton = giftProducts[i].querySelector('a.cart__item__remove');
if(removeButton)
{
  removeButton.click();
}
}
      }
    } 
}

document.addEventListener("DOMContentLoaded", (event) => {
setItemsOnInit();
});


function showDrawer(selector)
  {
    var checkSelector = document.querySelector(selector);
    if(checkSelector)
    {
      checkSelector.classList.remove('hidden');
    }
  }

function closeAllDrawers()
{
  var array = document.querySelectorAll('.giftwrapDrawer');
  for (var i=0; i< array.length; i++)
    {
      array[i].classList.add('hidden');
    }
}


function closeAllDrawerswithDelay()
{
  setTimeout(closeAllDrawers,2000);
}