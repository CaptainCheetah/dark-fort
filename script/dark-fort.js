const KARGUNT = {
    "health": 15,
    "points": 0,
    "explored_rooms": 0,
    "silver": 0,
    "inventory": []
};

let CATACOMB = [{}];
let CURRENT = 0;

let RUNNING = false;
let WAITING = false;

const roll_tables = {
    "start_weapons" :[
        {},
        {
            "name": "warhammer (d6)",
            "attack": 6,
            "attack_bonus": 0,
            "damage": 6,
            "damage_bonus": 0
        },
        {
            "name": "dagger (d4) +1 attack",
            "attack": 4,
            "attack_bonus": 1,
            "damage": 4,
            "damage_bonus": 0
        },
        {
            "name": "sword (d6) +1 attack",
            "attack": 4,
            "attack_bonus": 1,
            "damage": 4,
            "damage_bonus": 0
        },
        {
            "name": "flail (d6 + 1)",
            "attack": 6,
            "attack_bonus": 1,
            "damage": 6,
            "damage_bonus": 1
        }
    ],
    "start_items" :[
        {},
        {
            "name": "armor -d4 damage",
            "damage_reduction": 4
        },
        {
            "name": "potion heal d6 hp",
            "heal": 6
        },
        {
            "name": "scroll: summon weak demon",
            "attack": 4,
            "fights": 4
        },
        {
            "name": "cloak of invisibility"
        }
    ],
    "entrance": [
        {},
        {
            "description": "kargunt finds a random item amongst the detritus",
            "table": "items",
            "pickup": true
        },
        {
            "description": "a weak monster stands guard",
            "table": "weak_monsters",
            "pickup": false
        },
        {
            "description": "a dying mystic gives kargunt a random scroll",
            "table": "scrolls",
            "pickup": true
        },
        {
            "description": "the entrance is eerily quiet and desolate"
        }
    ],
    "items": [
        {},
        {
            "name": "random weapon"
        },
        {
            "name": "potion (heal d6 hp)"
        },
        {
            "name": "rope (+1 on trap roll)"
        },
        {
            "name": "random scroll"
        },
        {
            "name": "armor (-d4 damage)"
        },
        {
            "name": "cloak of invisibility"
        }
    ],
    "scrolls": [
        {},
        {
            "name": "scroll: summon weak demon"
        },
        {
            "name": "scroll: palms open the southern gate"
        },
        {
            "name": "scroll: aegis of sorrow"
        },
        {
            "name": "scroll: false omen"
        }
    ]
};

function typer(event) {
    if (!event) event = window.event;
    if (WAITING) {
        $('#history').html('Kargunt enters the dark fort');
        $('#modal').css('visibility','hidden');
        $('#command-line, #history-container, #left, #right').css('visibility','visible');
        WAITING = false;
        return;
    }
    const newChar = event.key;
    if ((newChar === 'Backspace' || newChar === 'Deleted') && $('#parser').text().length > 0) {    
        $('#parser').text( $('#parser').text().slice(0,-1))
    } else  if (newChar.length === 1) {
        if ($('#parser').text().length < 17) {
            $('#parser').text( $('#parser').text() + event.key);
        } else {
            $('#parser').text($('#parser').text().replace(/.$/,event.key));
        }
    } else if (newChar === 'Enter') {
        $('#history').html(parse( $('#parser').text()));
        $('#parser').text('');
    }
};

function parse(text) {
    let words = text.split(' ');
    let response;
    switch (words[0].toLowerCase()) {
        case '':
            response = 'silence responds to kargunt\'s silence';
            break;
        case 'go':
            if (words.length === 1) {
                response = 'go where?';
            } else if ( !isNaN(parseInt(words[1])) && CATACOMB[CURRENT].connected.indexOf(parseInt(words[1])) !== -1 ) {
                response = `kargunt enters door number ${words[1]}`;
                if (CATACOMB[CURRENT]['explored'] !== false) CATACOMB[CURRENT]['explored'] = true;
                CURRENT = parseInt(words[1]);
                renderMap();
                /*
                if (!CATACOMB[CURRENT].connected.indexOf(parseInt(words[1])).explored) {
                    generateRoom(parseInt(words[1]));
                }
                */
            } else {
                response = 'kargunt cannot go there';
            }
            break;
        case 'flee':
            if (words.length === 1) {
                response = 'flee where?';
            }  else if ( !isNaN(parseInt(words[1])) && CATACOMB[CURRENT].connected.indexOf(parseInt(words[1])) !== -1 ) {
                response = `kargunt bravely runs away and flees through door number ${words[1]}`;
                if (CATACOMB[CURRENT]['explored'] !== true) CATACOMB[CURRENT]['explored'] = false;
                CURRENT = parseInt(words[1]);
                renderMap();
            } else {
                response = 'kargunt cannot flee there';
            }
            break;
        case 'look':
            const currentRoom = CATACOMB[CURRENT].look;
            response = `${currentRoom.description}  - ${CATACOMB[CURRENT].connected.length} door${CATACOMB[CURRENT].connected.length ===1 ?'':'s'} lead${CATACOMB[CURRENT].connected.length ===1 ?'s':''} out`;
            if (currentRoom.pickup && currentRoom.table) {
                pickup(roll_tables[currentRoom.table][rollDie((roll_tables[currentRoom.table].length - 1),1)].name);
                delete CATACOMB[CURRENT].look.table;
                CATACOMB[CURRENT].look.description = 'nothing of value remains';
            }
            break;
        case 'attack':
        case 'fight':
            response = 'kargunt attacks the darkness';
            break;
        case 'help':
            response = 'kargunt\'s cries for help go unanswered';
            break;
        case 'quit':
            $('#command-line').css('visibility','visible');
            $('#modal, #history-container, #left, #right').css('visibility','hidden');
            RUNNING = false;
            WAITING = false;
            break;
        case 'restart':
            if (RUNNING) {
                RUNNING = false;
                $('#modal, #history-container, #left, #right').css('visibility','hidden');
            } else {
                break;
            }
        case 'run':
        case 'start':
            if (!RUNNING) {
                $('#command-line').css('visibility','hidden');
                $('#modal').css('visibility','visible');
                init();
                RUNNING = true;
                WAITING = true;
                break;
            }
        default:
            response = 'What\'s "' + text + '", precious?';
    }
    return response;
}

function getObject(obj, searchKey, searchValue) {
    let result = null;
    if(obj instanceof Array) {
        for(let i = 0; i < obj.length; i++) {
            result = getObject(obj[i], searchKey, searchValue);
            if (result) {
                break;
            }   
        }
    } else {
        for(let prop in obj) {
            if(prop == searchKey) {
                if(obj[prop] == searchValue) {
                    return obj;
                }
            }
            if(obj[prop] instanceof Object || obj[prop] instanceof Array) {
                result = getObject(obj[prop], searchKey, searchValue);
                if (result) {
                    break;
                }
            } 
        }
    }
    return result;
}

function init() {
    const audio = document.getElementById('audio');
    audio.playbackRate = 0.7;
    audio.play();
    $('#silver').text(15 + rollDie(6,1));
    $("#inventory").html('');
    $("#health").html('');
    $("#points").html('');
    $("#rooms").html('');
    CATACOMB = [{}];
    for (i = 0; i < 15; i++) {
        $("#health").append('<div></div>');
        $("#points").append('<div class="empty"></div>');
        if (i < 12) {
            $("#rooms").append('<div class="empty"></div>');
        }
    }
    const entranceRoll = rollDie(roll_tables.entrance.length - 1);
    CATACOMB[CURRENT]['look'] = roll_tables.entrance[entranceRoll];
    CATACOMB[CURRENT]['connected'] = Array.apply(null, Array(entranceRoll)).map(function (x, i) { return i + (CURRENT + 1); });
    for (i = 0; i < entranceRoll; i++) {
        console.log(i + ' : ' + entranceRoll);
        CATACOMB.push({
            'look': {
                'description': 'an empty room'
            },
            'connected': [0]
        });
    }
    pickup(roll_tables.start_weapons[rollDie((roll_tables.start_weapons.length - 1),1)].name);
    pickup(roll_tables.start_items[rollDie((roll_tables.start_items.length - 1),1)].name);
    renderMap();
}

function pickup(item) {
    $("#inventory").append('<li>' + item + '</li>');
}

function renderMap() {
    $('#catacomb').text(JSON.stringify(CATACOMB, null, 2));
}

function rollDie(sides, amount) {
    const numberOfDice = amount || 1;
    let result = 0;
    let i = 0;
    while (i < numberOfDice) {
        result += Math.floor(Math.random() * sides) + 1;
        i++;
    }
    return result;
  }

$(document).ready(() => {
    document.addEventListener("keydown", typer);
    // init();

    console.log('Welcome to Dark Fort');
});