let currentUser = null;
let currentChat = "";

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
    loadRequests();
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



    // Send message

    const { error } =
    await supabaseClient
    .from("messages")
    .insert({

        sender: currentUser.id,
        receiver: currentChat,
        message: text

    });



    if(error){

        console.log(error);
        alert(error.message);
        return;

    }



    // Create notification

    const { error: notificationError } =
    await supabaseClient
    .from("notifications")
.insert({

    user_id: currentChat,
    sender_id: currentUser.id,
    messages: text,
    read: false

});



    if(notificationError){

        console.log(
            "Notification error:",
            notificationError
        );

    }



    input.value = "";

}



// =========================
// LOAD NOTIFICATIONS
// =========================

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


    console.log(
        "Notifications:",
        data
    );

}



// =========================
// MARK NOTIFICATIONS READ
// =========================

async function markNotificationsRead(senderID){

    console.log("Reading from:", senderID);


    const { data, error } =
    await supabaseClient
    .from("notifications")
    .update({
        read:true
    })
    .eq(
        "user_id",
        currentUser.id
    )
    .eq(
        "sender_id",
        senderID
    )
    .select();



    console.log("READ RESULT:", data);


    if(error){

        console.log(
            "READ ERROR:",
            error
        );

    }

}


// =========================
// OPEN CHAT
// =========================

async function openChat(id, name){

    console.log("OPEN CHAT ID:", id);
    console.log("OPEN CHAT NAME:", name);


    currentChat = id;


    await markNotificationsRead(id);


    document.getElementById("chatName").innerHTML =
    name;


    await loadMessages();


    await updateNotificationBadges();

}



// =========================
// UPDATE NOTIFICATION NUMBERS
// =========================

async function updateNotificationBadges(){

    const friends =
    document.querySelectorAll(".friend");


    for(const friend of friends){


        const friendID =
        friend.dataset.id;


        const badge =
        friend.querySelector(".notification");


        if(!badge || !friendID){

            continue;

        }



        const { data, error } =
        await supabaseClient
        .from("notifications")
        .select("*")
        .eq(
            "user_id",
            currentUser.id
        )
        .eq(
            "sender_id",
            friendID
        )
        .eq(
            "read",
            false
        );



        if(error){

            console.log(error);
            continue;

        }



        const count =
        data.length;



        if(count > 0){

            badge.innerHTML = count;
            badge.style.display = "flex";

        }

        else{

            badge.style.display = "none";

        }


    }

}

// =========================
// LOAD MESSAGES
// =========================

async function loadMessages(){

    if(currentChat === ""){

        return;

    }


    const { data, error } =
    await supabaseClient
    .from("messages")
    .select("*")
    .or(
    `and(sender.eq.${currentUser.id},receiver.eq.${currentChat}),and(sender.eq.${currentChat},receiver.eq.${currentUser.id})`
    )
    .order("created_at",{ascending:true});



    if(error){

        console.log(
            "Load messages error:",
            error
        );

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
// CREATE MESSAGE
// =========================

async function createMessage(msg){

    const box =
    document.getElementById("messages");


    const div =
    document.createElement("div");


    if(msg.sender === currentUser.id){

        div.className =
        "message my-message";

    }

    else{

        div.className =
        "message";

    }



    div.innerHTML = `

    <div>
        ${msg.message}
    </div>

    `;


    box.appendChild(div);

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


    const {data,error} =
    await supabaseClient
    .from("friends")
    .select("*")
    .eq("status","accepted")
    .or(
        `user1.eq.${currentUser.id},user2.eq.${currentUser.id}`
    );


    if(error){

        console.log(error);
        return;

    }


    list.innerHTML = "";


    for(const friend of data){


        let friendID;


        if(friend.user1 === currentUser.id){

            friendID = friend.user2;

        }

        else{

            friendID = friend.user1;

        }



        const {data:profile,error:profileError} =
        await supabaseClient
        .from("profiles")
        .select("*")
        .eq("id",friendID)
        .single();



        if(profileError){

            console.log(profileError);
            continue;

        }



        const div =
        document.createElement("div");


        div.className="friend";


        div.innerHTML = `

        <img
        class="avatar"
        src="${
        profile.avatar_url ||
        "https://api.dicebear.com/9.x/initials/svg?seed=" 
        + profile.display_name
        }">


        <span>
        ${profile.display_name}
        </span>

        `;



        div.onclick = ()=>{

            openChat(
                profile.id,
                profile.display_name
            );

        };



        list.appendChild(div);


    }


    console.log("Friends loaded ✅");


}

// =========================
// LOAD FRIEND REQUESTS
// =========================

async function loadRequests(){


    const box =
    document.getElementById("friendRequests");


    if(!box){

        console.log("No request box found");
        return;

    }



    const {data,error} =
    await supabaseClient
    .from("friends")
    .select("*")
    .eq("user2", currentUser.id)
    .eq("status","pending");



    if(error){

        console.log("Request loading error:", error);
        return;

    }



    box.innerHTML = "";



    if(data.length === 0){

        box.innerHTML = `
        
        <p>
        No friend requests 💙
        </p>

        `;

        return;

    }





    for(const request of data){


        const {data:profile,error:profileError} =
        await supabaseClient
        .from("profiles")
        .select("*")
        .eq("id",request.user1)
        .single();



        if(profileError){

            console.log(profileError);
            continue;

        }




        const div =
        document.createElement("div");


        div.className = "request";



        div.innerHTML = `

        <p>
        ${profile.display_name}
        wants to be friends
        </p>


        <button onclick="acceptRequest('${request.id}')">

            ✅ Accept

        </button>


        <button onclick="declineRequest('${request.id}')">

            ❌ Decline

        </button>

        `;



        box.appendChild(div);


    }


    console.log("Friend requests loaded ✅");


}

// =========================
// ACCEPT FRIEND REQUEST
// =========================

async function acceptRequest(id){


    const {error} =
    await supabaseClient
    .from("friends")
    .update({

        status:"accepted"

    })
    .eq("id",id);



    if(error){

        console.log(error);
        return;

    }


    alert("Friend added 💙");


    loadRequests();
    loadFriends();


}

// =========================
// DECLINE FRIEND REQUEST
// =========================

async function declineRequest(id){


    const {error} =
    await supabaseClient
    .from("friends")
    .delete()
    .eq("id",id);



    if(error){

        console.log(error);
        return;

    }


    loadRequests();


}

// =========================
// SEARCH USERS
// =========================

async function searchUsers(){

    const username =
document.getElementById("userSearch")
.value
.trim();


    if(username === ""){
        return;
    }


    const {data,error} =
    await supabaseClient
    .from("profiles")
    .select("*")
    .ilike("username","%" + username + "%");


    if(error){

        console.log(error);
        return;

    }


    const results =
    document.getElementById("searchResults");


    results.innerHTML="";


    data.forEach(user=>{


        if(user.id === currentUser.id){
            return;
        }


        const div =
        document.createElement("div");


        div.innerHTML = `

        <span>
        ${user.username}
        </span>

        <button onclick="sendFriendRequest('${user.id}')">
        ➕ Add Friend
        </button>

        `;


        results.appendChild(div);


    });


}

// =========================
// SEND FRIEND REQUEST
// =========================

async function sendFriendRequest(friendID){

    const {error} =
    await supabaseClient
    .from("friends")
    .insert({

        user1: currentUser.id,
        user2: friendID,
        status:"pending"

    });


    if(error){

        console.log(error);
        alert(error.message);
        return;

    }


    alert("Friend request sent 💙");

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
// CLOSE PROFILE
// =========================

function closeProfile(){

    document.getElementById("profilePanel").style.display = "none";

}