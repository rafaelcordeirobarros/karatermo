
function todayInBrazil(){
    // Create a new Date object with the current date and time
    let date = new Date();
    // Get the current time in milliseconds since January 1, 1970, 00:00:00 UTC
    let utcTime = date.getTime() + (date.getTimezoneOffset() * 60000);
    // Create a new Date object for GMT-3
    let todayDate = new Date(utcTime - (3 * 3600000));

    return todayDate;
}


async function populateSelect(selectObjectId, options, onChangeFunction) {

    const selectObject = document.getElementById(selectObjectId);

    options.forEach(option => {
        const selectOption = document.createElement("option");
        selectOption.value = option.id;
        selectOption.textContent = option.label;
        selectObject.appendChild(selectOption);
    });

    selectObject.addEventListener("change", () => {
        onChangeFunction(selectObject.value);
    });

    // Define o conteúdo inicial
    onChangeFunction();
}