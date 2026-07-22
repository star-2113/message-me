let currentChat = "";

let chats = {
    "Aroush": [],
    "Saavi": [],
    "Reshma": [],
    "Study Group": [],
    "Gaming": []
};

function enterSend(event){
    if(event.key === "Enter"){
        sendMessage();
    }
}

function sendMessage(){

    if(currentChat === ""){
        alert("Please choose a chat first!");
        return;
    }

    let input = document.getElementById("messageInput");
    let text = input.value;

    if(text.trim() === ""){
        return;
    }

    chats[currentChat].push({
        sender: "You",
        text: text
    });

    showMessages();

    input.value = "";

}

function showMessages(){

    let box = document.getElementById("messages");
    box.innerHTML = "";

    chats[currentChat].forEach(function(msg){

        let message = document.createElement("div");

        if(msg.sender === "You"){
            message.className = "message my-message";
        } else {
            message.className = "message";
        }

        message.innerHTML =
            "<div class='message-name'>" +
            msg.sender +
            "</div>" +
            msg.text;

        box.appendChild(message);

    });

}

function openChat(name){

    currentChat = name;

    document.getElementById("chatName").innerHTML = "Chat with " + name;

    showMessages();

}

function mode(){
    document.body.classList.toggle("light");
}

function searchFriends(){

    let search = document
        .getElementById("searchFriends")
        .value
        .toLowerCase();

    let friends = document.getElementsByClassName("friend");

    for(let i=0;i<friends.length;i++){

        let name = friends[i].innerText.toLowerCase();

        if(name.includes(search)){
            friends[i].style.display = "flex";
        }else{
            friends[i].style.display = "none";
        }

    }

}