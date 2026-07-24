let currentUser = null;
let currentChat = "";


// =========================
// LOAD USER
// =========================

// =========================
// LOAD USER
// =========================

async function loadUser(){

    const { data, error } =
        await supabaseClient.auth.getUser();

    if(error || !data.user){

        window.location.href = "index.html";
        return;

    }

    currentUser = data.user;

    // Only run these on chat.html
    if(document.getElementById("friendsList")){

        loadFriends();
        listenForMessages();

    }

}

loadUser();

// =========================
// ENTER SEND
// =========================

function enterSend(event){

    if(event.key === "Enter"){

        sendMessage();

    }

}



// =========================
// SEND MESSAGE
// =========================

async function sendMessage(){


    if(currentChat === ""){

        alert("Choose a friend first 💙");
        return;

    }


    const input =
        document.getElementById("messageInput");


    const text =
        input.value.trim();



    if(text === ""){

        return;

    }



    const { error } =
await supabaseClient
.from("messages")
.insert({

    sender: currentUser.id,
    receiver: currentChat,
    message: text

});


if(error){

    alert(error.message);
    return;

}
async function loadNotifications(){

    const { data, error } =
    await supabaseClient
    .from("notifications")
    .select("*")
    .eq("user_id", currentUser.id)
    .eq("read", false);


    if(error){

        console.log(error);
        return;

    }


    const friends =
    document.querySelectorAll(".friend");


    friends.forEach(friend=>{

        const badge =
        friend.querySelector(".notification");


        if(badge){

            if(data.length > 0){

                badge.innerHTML = data.length;
                badge.style.display = "flex";

            }

            else{

                badge.style.display = "none";

            }

        }

    });

}

// Create notification
await supabaseClient
.from("notifications")
.insert({

    user_id: currentChat,
    sender_id: currentUser.id,
    message: text,
    read: false

});



    if(error){

        alert(error.message);
        return;

    }


    input.value = "";

}


// =========================
// OPEN CHAT
// =========================

function openChat(id,name){


    currentChat = id;



    document.getElementById("chatName").innerHTML =
        name;



    document.getElementById("chatAvatar").src =
        "https://api.dicebear.com/9.x/initials/svg?seed=" + name;



    loadMessages();


}



// =========================
// LOAD OLD MESSAGES
// =========================

async function loadMessages(){


    if(currentChat === ""){

        return;

    }



    const {data,error} =
        await supabaseClient
        .from("messages")
        .select("*")
        .or(
        `and(sender.eq.${currentUser.id},receiver.eq.${currentChat}),and(sender.eq.${currentChat},receiver.eq.${currentUser.id})`
        )
        .order("created_at",{ascending:true});



    if(error){

        console.log(error);
        return;

    }



    const box =
        document.getElementById("messages");


    box.innerHTML = "";



    for(const msg of data){

        await createMessage(msg);

    }



    box.scrollTop =
        box.scrollHeight;


}




// =========================
// CREATE MESSAGE BUBBLE
// =========================

async function createMessage(msg){


    const box =
        document.getElementById("messages");



    const message =
        document.createElement("div");



    if(msg.sender === currentUser.id){

        message.className =
            "message my-message";

    }

    else{

        message.className =
            "message";

    }



    let name = "Friend";



    if(msg.sender === currentUser.id){

        name = "You";

    }

    else{


        const {data:profile} =
            await supabaseClient
            .from("profiles")
            .select("display_name")
            .eq("id",msg.sender)
            .single();



        if(profile){

            name = profile.display_name;

        }

    }



    const time =
        new Date(msg.created_at)
        .toLocaleTimeString([],{

            hour:"2-digit",
            minute:"2-digit"

        });



    message.innerHTML = `

        <div class="message-name">
            ${name}
        </div>

        <div>
            ${msg.message}
        </div>

        <small>
            ${time}
        </small>

    `;



    box.appendChild(message);


}




// =========================
// LOAD FRIENDS
// =========================

async function loadFriends(){

    const list =
        document.getElementById("friendsList");


    if(!list){

        return;

    }



    const { data, error } =
        await supabaseClient
        .from("profiles")
        .select("*")
        .neq("id", currentUser.id);



    if(error){

        console.log(error);
        return;

    }



    list.innerHTML = "";



    for(const friend of data){


        const { data: notifications } =
            await supabaseClient
            .from("notifications")
            .select("*")
            .eq("user_id", currentUser.id)
            .eq("sender_id", friend.id)
            .eq("read", false);



        const count =
            notifications ? notifications.length : 0;



        const div =
            document.createElement("div");



        div.className = "friend";



        div.innerHTML = `

            <img
            src="${
                friend.avatar_url ||
                "https://api.dicebear.com/9.x/initials/svg?seed=" +
                encodeURIComponent(friend.display_name)
            }"
            class="avatar">


            <span>
                ${friend.display_name}
            </span>


            <span class="notification"
            ${count === 0 ? 'style="display:none;"' : ""}>
                ${count}
            </span>

        `;



        div.onclick = () => {

            openChat(
                friend.id,
                friend.display_name
            );

        };



        list.appendChild(div);


    }


    console.log("Friends loaded with notifications ✅");


}




// =========================
// SEARCH FRIENDS
// =========================

function searchFriends(){

    const searchInput =
        document.getElementById("searchFriends");


    if(!searchInput){

        return;

    }



    const search =
        searchInput.value
        .toLowerCase()
        .trim();



    const friends =
        document.getElementsByClassName("friend");



    for(let friend of friends){


        const name =
            friend.innerText
            .toLowerCase();



        if(name.includes(search)){


            friend.style.display = "flex";


        }

        else{


            friend.style.display = "none";


        }


    }


}





// =========================
// DARK MODE
// =========================

function mode(){

    document.body.classList.toggle("light");

}
// =========================
// REALTIME
// =========================

let messageChannel = null;

function listenForMessages(){

    // Stop duplicate channels
    if(messageChannel){

        return;

    }


    messageChannel =
        supabaseClient
        .channel("messages");


    messageChannel
    .on(

        "postgres_changes",

        {
            event:"INSERT",
            schema:"public",
            table:"messages"
        },

        async payload=>{


            const msg = payload.new;


            if(

                (msg.sender === currentUser.id &&
                msg.receiver === currentChat)

                ||

                (msg.sender === currentChat &&
                msg.receiver === currentUser.id)

            ){


                await createMessage(msg);


                const box =
                    document.getElementById("messages");


                if(box){

                    box.scrollTop =
                        box.scrollHeight;

                }

            }


        }

    )

    .subscribe();

}



// =========================
// SAVE PROFILE DEBUG
// =========================

async function saveProfile(){

    const displayName =
        document.getElementById("displayNameInput")
        .value
        .trim();


    const username =
        document.getElementById("usernameInput")
        .value
        .trim();


    const bio =
        document.getElementById("bioInput")
        .value
        .trim();



    console.log("Current user:", currentUser.id);

    console.log("Trying to save:", {
        displayName,
        username,
        bio
    });



    const { data, error } =
        await supabaseClient
        .from("profiles")
        .update({

            display_name: displayName,
            username: username,
            bio: bio

        })
        .eq(
            "id",
            currentUser.id
        )
        .select();



    console.log("Supabase response:", data);
    console.log("Supabase error:", error);



    if(error){

        alert(error.message);
        return;

    }


    if(!data || data.length === 0){

        alert("Nothing updated 😭 Check your profile ID/RLS");

        return;

    }


    alert("Profile updated! 🎉");

}
// =========================
// LOAD SETTINGS
// =========================

async function loadSettings(){

    console.log("Loading settings...");

    const { data, error } =
        await supabaseClient
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .single();


    if(error){

        console.log(error);
        return;

    }


    console.log("Display Name:", data.display_name);
console.log("Username:", data.username);
console.log("Bio:", data.bio);
console.log("Avatar URL:", data.avatar_url);
console.log(data);



    document.getElementById("displayNameInput").value =
        data.display_name || "";


    document.getElementById("usernameInput").value =
        data.username || "";


    document.getElementById("bioInput").value =
        data.bio || "";


    document.getElementById("emailInput").value =
        currentUser.email || "";



   if(data.avatar_url){

    document.getElementById("avatarPreview").src =
        data.avatar_url;

}
else{

    document.getElementById("avatarPreview").src =
    "https://api.dicebear.com/9.x/initials/svg?seed=" 
    + encodeURIComponent(data.display_name || "User");

}


}


// =========================
// SAVE EMAIL
// =========================

async function saveEmail() {

    const email = document.getElementById("emailInput").value.trim();

    if (email === "") {
        alert("Please enter an email 💙");
        return;
    }

    const { error } = await supabaseClient.auth.updateUser({
        email: email
    });

    if (error) {
        console.log(error);
        alert(error.message);
        return;
    }

    alert("Check your email to confirm your new email 📧");
}


// =========================
// OPEN PROFILE
// =========================

async function openProfile(id) {

    const { data, error } = await supabaseClient
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();

    if (error) {
        console.log(error);
        alert("Couldn't load profile 💙");
        return;
    }

    document.getElementById("profileName").textContent =
        data.display_name || "Unknown User";

    document.getElementById("profileUsername").textContent =
        "@" + (data.username || "username");

    document.getElementById("profileBio").textContent =
        data.bio || "No bio yet 💙";

    document.getElementById("profileImage").src =
        data.avatar_url ||
        "https://api.dicebear.com/9.x/initials/svg?seed=" +
        encodeURIComponent(data.display_name || "User");

    document.getElementById("profilePanel").style.display = "flex";
}


// =========================
// UPLOAD PROFILE PICTURE
// =========================

async function uploadAvatar(){

    console.log("1. Starting upload");


    const file =
        document.getElementById("avatarInput").files[0];


    console.log("2. File:", file);


    if(!file){

        alert("Choose a picture first 💙");
        return;

    }


    const fileName = `${currentUser.id}/${file.name}`;


    console.log("3. File path:", fileName);



    const upload =
        await supabaseClient
        .storage
        .from("avatars")
        .upload(
            fileName,
            file,
            {
                upsert:true
            }
        );


    console.log("4. Upload response:", upload);



    if(upload.error){

        alert(upload.error.message);
        return;

    }



    const url =
        supabaseClient
        .storage
        .from("avatars")
        .getPublicUrl(fileName);



    console.log("5. URL:", url.data.publicUrl);



    const update =
        await supabaseClient
        .from("profiles")
        .update({

            avatar_url: url.data.publicUrl

        })
        .eq(
            "id",
            currentUser.id
        )
        .select();



    console.log("6. Profile update:", update);



    alert("Done 🎉");

}

// =========================
// LOAD NOTIFICATIONS
// =========================

async function loadNotifications(){

    console.log("Loading notifications...");

    const { data, error } =
    await supabaseClient
    .from("notifications")
    .select("*")
    .eq("user_id", currentUser.id)
    .eq("read", false);


    if(error){

        console.log("Notification error:", error);
        return;

    }


    console.log("Notifications:", data);


}