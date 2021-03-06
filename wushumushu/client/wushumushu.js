// Client-side JavaScript, bundled and sent to client.

// Define Minimongo collections to match server/publish.js.
Shows = new Meteor.Collection("shows");
Acts = new Meteor.Collection("acts");
Sections = new Meteor.Collection("sections");
Moves = new Meteor.Collection("moves");
Weapons = new Meteor.Collection("weapons");


// ID of current show, act, section, move, weapon
Session.setDefault('current_show_id', null);
Session.setDefault('current_show_name', null); //name for breadcrumb purposes
Session.setDefault('current_act_id', null);
Session.setDefault('current_act_name', null);  //name for breadcrumb purposes
Session.setDefault('current_section_id', null);
Session.setDefault('current_move_id', null);
Session.setDefault('current_weapon_id', null);
Session.setDefault('current_song_url', null);

// Edit mode: true if editing, false otherwise
  Session.setDefault('edit_mode',  false);

// Vars for editing section and move
  Session.setDefault('editing_section', null);
  Session.setDefault('editing_move', null);


var clientId = "5fd98f74f1cfa3c22b3330bb71ac478a";

var songOptions = [];

Session.setDefault('song_options', null);

///////////DEBUGGING METHODS /////////////
var setSessionVars = function() {
  pickedSection = Sections.findOne({act_id: Session.get("current_act_id")});
  if (pickedSection) {
    console.log("SECTION NOT NULL");
    Session.set('current_section_id', pickedSection['_id']);
  }

  pickedMove = Moves.findOne({section_id: Session.get("current_section_id")});
  if (pickedMove) {
    console.log("MOVE NOT NULL");
    Session.set('current_move_id', pickedMove['_id']);
  }
};



// Subscriptions go here (when I figure out how to do that...)

var showsHandle = null;
var actsHandle = null;
var sectionsHandle = null;
var movesHandle = null;
var weaponsHandle = null;
// Always be subscribed to shows, and only subscribe to acts for current show
// Always be subscribed to the sections, moves and weapons for the selected act.
Deps.autorun(function () {

  showsHandle = Meteor.subscribe('shows');

  var show_id = Session.get('current_show_id');
  if (show_id) {
    actsHandle = Meteor.subscribe('acts', show_id)
  }
  else {
    actsHandle = null;
  }

  var act_id = Session.get('current_act_id');
  if (act_id) {
    sectionsHandle = Meteor.subscribe('sections', act_id);
    movesHandle = Meteor.subscribe('moves', act_id);
    weaponsHandle = Meteor.subscribe('weapons', act_id);
  }
  else {
    sectionsHandle = null;
    movesHandle = null;
    weaponsHandle = null;
  }
});


////////// Helpers for navbar ////////////
Template.nav_bar.loading = function() {
  return ((!showsHandle.ready()) || (!actsHandle.ready()) || (!sectionsHandle.ready()));
}

Template.nav_bar.shows_loading = function() {
  return !showsHandle.ready();
}

Template.nav_bar.acts_loading = function() {
  return !actsHandle.ready();
}

Template.nav_bar.sections_loading = function() {
  return !sectionsHandle.ready();
}

Template.nav_bar.show_selected = function() {
  return !Session.equals('current_show_id', null);
}

Template.nav_bar.current_show_name = function() {
  if (!Session.equals('current_show_id', null)) {
    return Shows.findOne({_id: Session.get('current_show_id')}).name;
  }
}

Template.nav_bar.current_show_id = function() {
  return Session.get('current_show_id');
}

Template.nav_bar.act_selected = function() {
  return !Session.equals('current_act_id', null);
}

Template.nav_bar.current_act_name = function() {
  if (!Session.equals('current_act_id', null)) {
    return Acts.findOne({_id: Session.get('current_act_id')}).name;
  }
}

Template.nav_bar.section_selected = function() {
  return !Session.equals('current_section_id', null);
}

Template.nav_bar.current_section_name = function() {
  if (!Session.equals('current_section_id', null)) {
    return Sections.findOne({_id: Session.get('current_section_id')}).name;
  }
}

Template.nav_bar.edit_class =  function() {
  if (Session.equals('edit_mode',true)) {
    return 'btn-primary';
  }
}

Template.nav_bar.view_class = function() {
  if (Session.equals('edit_mode', false)) {
    return 'btn-primary';
  }
}

Template.nav_bar.events({
  'click #edit-mode-button': function() {
    Session.set('edit_mode',true);
  },
  'click #view-mode-button': function() {
    Session.set('edit_mode',false);
  }
})


////////// Helpers for shows /////////////

/*
        <ul class="list-group" id="all-shows">
          {{#each shows}}
          <li class="list-group-item show-item" id="show-{{_id}}" style="pointer-events: all;">
          <table style="width: 100%; margin: 0px;"><tr>
          <td style="vertical-align: top; font-size: 22pt;">
          <b><div> {{name}} </div></b>
          </td><td style="text-align: right; vertical-align: top; width: 40%;">
          <div> {{location}} </div>
          <div> {{date}} </div>
          <div>
            <span> {{start}} </span> &#8212; <span> {{end}} </span>
          </div>
          </td></tr></table></li>
          {{/each}}
        </ul><!-- end list-group of shows -->
*/

Template.shows_page.loading = function() {
  return !showsHandle.ready();
}

Template.shows_page.edit_mode = function() {
  return Session.equals('edit_mode', true);
}

function loadDatetimePickers() {
  $(".date_picker").datepicker({
    changeMonth : true ,
    changeYear  : true ,
  });
  $(".time_picker").timepicker();
  /*
  
  hold off until bug-free version of timepicker found

  $(".time_picker").timepicker({
    showInputs  : true ,
    template    : 'backdrop' ,
  });
  */
}

Template.shows_page.events({
  'click #new-show-btn': function() {
    var rowSpacing = '<tr style="height:20px;"></tr>';
    var newShowDialogHTML =
    '<table class="add-show-dialog"><tr><td style="width:45%;"><label>Show name \*</label>'+
    '</td><td><input type="text" name="showName" value=""></td></tr>'+rowSpacing+
    '<tr><td><label>Date</label></td><td><input type="text" name="showDate" '+
    'class="date_picker" value=""></td></tr>'+rowSpacing+
    '<tr><td><label>Start time</label></td><td><input type="text" name="showTimeStart" '+
    'class="time_picker" value=""></td></tr>'+rowSpacing+
    '<tr><td><label>End time</label></td><td><input type="text" name="showTimeEnd" '+
    'class="time_picker" value=""></td></tr>'+rowSpacing+
    '<tr><td><label>Location</label></td><td><input type="text" name="showLocation" '+
    'value=""></td></tr></table><br>Fields marked \* are required<br><br>';
    var newShowPrompt = {
      state0: {
        title: 'Add new show',
        html: newShowDialogHTML,
        buttons: { 'Cancel': -1, 'Done': 1 },
        focus: 1,
        submit: function(e,v,m,f) {
          if (f.showName == "" && v == 1) { alert('The show name cannot be left blank'); }
          if (f.showName != "" && v == 1) {
            var new_show_id = Shows.insert({
              name: f.showName,
              date: f.showDate,
              start: f.showTimeStart,
              end: f.showTimeEnd,
              location: f.showLocation,
            });
            e.preventDefault();
            $.prompt.close();
          } // end if block processing inputs
        } // end submit function of state0
      } // end state0 of newShowPrompt
    }; // end newShowPrompt
    $.prompt(newShowPrompt);
    loadDatetimePickers();
  }, // end click #new-show-btn
  
  'click .show-item': function() {
    var showID = $(event.target).attr("id").split("-")[1];
    if (Session.equals('edit_mode', true)) {
      var showCursor = Shows.findOne({_id: showID});
      var rowSpacing = '<tr style="height:20px;"></tr>';
      var editShowDialogHTML =
      '<table class="add-show-dialog"><tr><td style="width:45%;"><label>Show name \*</label>'+
      '</td><td><input type="text" name="showName" value="'+ showCursor.name +
      '"></td></tr>'+rowSpacing+
      '<tr><td><label>Date</label></td><td><input type="text" name="showDate" '+
      'class="date_picker" value="'+ showCursor.date +
      '"></td></tr>'+rowSpacing+
      '<tr><td><label>Start time</label></td><td><input type="text" name="showTimeStart" '+
      'class="time_picker" value="'+ showCursor.start +
      '"></td></tr>'+rowSpacing+
      '<tr><td><label>End time</label></td><td><input type="text" name="showTimeEnd" '+
      'class="time_picker" value="'+ showCursor.end +
      '"></td></tr>'+rowSpacing+
      '<tr><td><label>Location</label></td><td><input type="text" name="showLocation" '+
      'value="'+ showCursor.location +
      '"></td></tr></table><br>Fields marked \* are required<br><br>';
      var editShowPrompt = {
        state0: {
          title: 'Currently editing show: ' + showCursor.name,
          html: editShowDialogHTML,
          buttons: { 'Delete this show': -10, 'Cancel': -1, 'Save changes': 1 },
          focus: 1,
          submit: function(e,v,m,f) {
            if (v == 1 && f.showName == "") { alert('The show name cannot be left blank'); }
            if (v == 1 && f.showName != "") {
              Shows.update({ _id: showID }, {
                name: f.showName,
                date: f.showDate,
                start: f.showTimeStart,
                end: f.showTimeEnd,
                location: f.showLocation,
                show_id: Session.get('current_show_id')
              });
              e.preventDefault();
              $.prompt.close();
            }
            else if (v == -1) {
              e.preventDefault();
              $.prompt.close();
            }
            else if (v == -10) {
              e.preventDefault();
              $.prompt.goToState('deleteState', false, e); // goto deleteState
            }
            e.preventDefault();
          } //end submit function of state0
        }, // end state0 of editShowPrompt
        
        'deleteState': {
          title: 'Delete show',
          html: 'Are you sure you want to delete the show: <span style="color: red;">'+
                showCursor.name+'</span><br><br>This action cannot be undone<br><br>',
          buttons: { 'Yes, delete this show' : -1, 'No, keep this show': 1 },
          focus: 1,
          submit: function(e,v,m,f) {
            if (v == -1) {
              Shows.remove({_id: showID});
            }
          }
        } // end deleteState of editShowPrompt

      }; // end editShowPrompt
      $.prompt(editShowPrompt);
      loadDatetimePickers();      
    } // end if block checking if edit mode on

    else { // execute when edit_mode is off, should direct link to acts
      Session.set('current_show_id', showID);
      window.location.href = 'shows/' + showID;
    }
    Session.set('current_show_id', showID);
  } // end click .show-item
});

Template.shows_page.shows = function () {
  return Shows.find({}, {sort: {name: 1}});
};


////////// Helpers for Acts //////////////

Template.acts_page.loading = function() {
  return !actsHandle.ready();
}

Template.acts_page.acts_list= function() {
  return Shows.find({show_id: Session.get("current_show_id")});
}

Template.acts_page.edit_mode = function() {
  return Session.equals('edit_mode', true);
}

Template.acts_page.events({
  'click #new-act-btn': function() {
    var rowSpacing = '<tr style="height:20px;"></tr>';
    var newActDialogHTML =
    '<div style="text-align: center;">'+
    '<label>Act name \*</label><br><input type="text" name="actName" value=""><br><br>'+
    '<br>Fields marked \* are required<br><br></div>';
    var newActPrompt = {
      state0: {
        title: 'Add new act',
        html: newActDialogHTML,
        buttons: { 'Cancel': -1, 'Done': 1 },
        focus: 1,
        submit: function(e,v,m,f) {
          if (f.actName == "" && v == 1) { alert('The act name cannot be left blank'); }
          if (f.actName != "" && v == 1) {
            var new_act_id = Acts.insert({
              name: f.actName,
              show_id: Session.get('current_show_id')
            });
            e.preventDefault();
            $.prompt.close();
          } // end if block processing inputs
        } // end submit function of state0
      } // end state0 of newActPrompt
    }; // end newActPrompt
    $.prompt(newActPrompt);

  }, // end click #new-act-btn
  
  'click .act-item': function() {
    var actID = $(event.target).attr("id").split("-")[1];
    if (Session.equals('edit_mode', true)) {
      var actCursor = Acts.findOne({_id: actID});
      var rowSpacing = '<tr style="height:20px;"></tr>';
      var editActDialogHTML =
      '<div style="text-align: center;">'+
      '<label>Act name \*</label><br><input type="text" name="actName" value="'+ actCursor.name +
      '"><br><br>'+
      '<br>Fields marked \* are required<br><br></div>';
      var editActPrompt = {
        state0: {
          title: 'Currently editing act: ' + actCursor.name,
          html: editActDialogHTML,
          buttons: { 'Delete this act': -10, 'Cancel': -1, 'Save changes': 1 },
          focus: 1,
          submit: function(e,v,m,f) {
            if (v == 1 && f.actName == "") { alert('The act name cannot be left blank'); }
            if (v == 1 && f.actName != "") {
              Acts.update({ _id: actID }, {
                name: f.actName,
                show_id: Session.get('current_show_id')
              });
              e.preventDefault();
              $.prompt.close();
            }
            else if (v == -1) {
              e.preventDefault();
              $.prompt.close();
            }
            else if (v == -10) {
              e.preventDefault();
              $.prompt.goToState('deleteState', false, e); // goto deleteState
            }
            e.preventDefault();
          } //end submit function of state0
        }, // end state0 of editActPrompt
        
        'deleteState': {
          title: 'Delete act',
          html: 'Are you sure you want to delete the act: <span style="color: red;">'+
                actCursor.name+'</span><br><br>This action cannot be undone<br><br>',
          buttons: { 'Yes, delete this act' : -1, 'No, keep this act': 1 },
          focus: 1,
          submit: function(e,v,m,f) {
            if (v == -1) {
              Acts.remove({_id: actID});
            }
          }
        } // end deleteState of editActPrompt

      }; // end editActPrompt
      $.prompt(editActPrompt);
    } // end if block checking if edit mode on

    else { // execute when edit_mode is off, should direct link to acts
      Session.set('current_act_id', actID);
      window.location.href = Session.get('current_show_id') + '/' + actID;
    }
    Session.set('current_act_id', actID);
  } // end click .act-item
});

Template.acts_page.acts = function() {
  return Acts.find({show_id : Session.get('current_show_id')});
}



//////////// Helper for change_song //////////
Template.song_player.loading = function() {
  Session.set('song_options', []);
}

Template.song_player.stream_url = function() {
  console.log('testing song url');
  if (!Session.equals('current_act_id', undefined)) {
    console.log('trying to get song url');
    console.log(Acts.findOne({_id: Session.get('current_act_id')}));
    console.log(Acts.findOne({_id: Session.get('current_act_id')}).stream_url);
    var url = Acts.findOne({_id: Session.get('current_act_id')}).stream_url + "?client_id=" + clientId;
    Session.set('current_song_url', url);
    return url;
  }
  /*console.log(act_data);
  var act_song = act_data.fetch()[0];
  console.log(act_song);
  Session.set('current_song_url', act_song['stream_url']);
  console.log(Session.get('current_song_url'));
  return Session.get('current_song_url');*/
  //return "hello world!";
}

Template.song_player.rendered = function() {
  console.log('song player rendered');
  var audio = $("#player");
  $("#current_song").attr("src", Session.get("current_song_url")).detach().appendTo("#player");;

  audio[0].pause();
  audio[0].load();//suspends and restores all audio element
}

Template.song_player.edit_mode = function() {
  return Session.equals('edit_mode', true);
}

Template.choose_song.song_options = function() {
  //console.log(songOptions);
  console.log(Session.get('song_options'));
  //console.log(Session.equals('song_options', []));
  return Session.get('song_options');
}

Template.change_song.events({
  'click .choose-song-btn': function(evt, template) {
    evt.preventDefault();
    var songTitle = template.find("#song-title").value
    var artist = template.find("#artist").value
    console.log('songTitle: ' + songTitle + " Artist: " + artist);

    SC.initialize({
      client_id: clientId,
      redirect_uri: "http://example.com/callback.html",
    });

    if (songTitle !== "") {
      SC.get("/tracks", {q: songTitle}, function(tracks) {
        songOptions = [];
        for (var i=0; i < tracks.length; i++) {
          songOptions.push({id: tracks[i]['id'], 
            stream_url: tracks[i]['stream_url'], 
            title: tracks[i]['title']});
        }
        //console.log(songOptions);
        Session.set('song_options', songOptions);

        /*console.log(tracks);
        console.log(tracks[0]['stream_url']);
        var song_stream_url = tracks[0]['stream_url'];
        Acts.update(Session.get("current_act_id"), {$set: {stream_url: song_stream_url}});
        console.log(Acts.find(Session.get("current_act_id")));
        Session.set('current_song_url', song_stream_url + "?client_id=" + clientId);*/
      });
    } else {
      SC.get("/tracks", {q: artist}, function(tracks) {
        songOptions = [];
        for (var i=0; i < tracks.length; i++) {
          songOptions.push({id: tracks[i]['id'], 
            stream_url: tracks[i]['stream_url'], 
            title: tracks[i]['title']});
        }
        //console.log(songOptions);
        Session.set('song_options', songOptions);

        /*console.log(tracks);
        console.log(tracks[0]['stream_url']);
        var song_stream_url = tracks[0]['stream_url'];
        Acts.update(Session.get("current_act_id"), {$set: {stream_url: song_stream_url}});
        console.log(Acts.find(Session.get("current_act_id")));
        Session.set('current_song_url', song_stream_url + "?client_id=" + clientId);*/
      });
    }

  }
})

Template.show_song_option.events({
  'click .glyphicon-ok': function(evt, template) {
    console.log(evt.target.id);
    var id = evt.target.id.slice(0, -8);
    console.log(id);
    var result = Session.get('song_options').filter(function (obj) {
      return obj.id == id;
    });
    var selected_song = result[0];
    console.log(selected_song);
    Session.set('current_song_url',selected_song['stream_url'] + "?client_id=" + clientId);
    Acts.update(Session.get("current_act_id"), {$set: {stream_url: selected_song['stream_url']}});
    Session.set('song_options', []);
    var audio = $("#player");
    $("#current_song").attr("src", Session.get("current_song_url")).detach().appendTo("#player");;

    audio[0].pause();
    audio[0].load();//suspends and restores all audio element
  }
})



////////// Helper for sections_pane //////////

Template.sections_pane.loading = function() {
  //setSessionVars(); //THIS IS FOR DEBUGGING PURPOSES ONLY @JORDANM
  return !sectionsHandle.ready();
}

Template.sections_pane.sections = function() {
  console.log("Sections rendering");
  //console.log(Sections.find({act_id: Session.get("current_act_id")}));
  return Sections.find({act_id: Session.get("current_act_id")});
}

Template.sections_pane.default_active = function() {
  Session.set("current_section_id", Sections.findOne({act_id: Session.get("current_act_id")}));
}

Template.sections_pane.editing_section = function() {
  return Session.equals("editing_section", this._id);
}

Template.sections_pane.not_editing_section = function() {
  return Session.equals("editing_section", null);
}

Template.sections_pane.edit_mode = function() {
  return Session.equals('edit_mode', true);
}

Template.display_section.edit_mode = function() {
  return Session.equals('edit_mode', true);
}

Template.display_section.maybe_active = function() {
  return Session.equals("current_section_id", this._id) ? "active" : "";
};

Template.display_section.events({
    'click .section': function() {
      console.log(this._id + ' section clicked');
      Session.set("current_section_id", this._id);
      Session.set('current_move_id',null);
      Session.set('current_weapon_id',null);
    },

    'click .glyphicon-pencil': function() {
      console.log(this._id + ' glyphicon-pencil clicked');
      Session.set("editing_section", this._id);
    },

    'click .glyphicon-remove': function() {
      console.log(this._id + ' glyphicon-remove clicked');

      $.prompt("Are you sure you want to delete this section and all information associated with it?", {
            title: "Delete Section",
            buttons: { "No": false, "Yes": true },
            submit: function(e,v,m,f){
              if (v) {
                Sections.remove(Session.get("current_section_id"));
              }
            }
          });
    }
})

Template.update_section.events({
  'click .update-section-btn': function(evt, template) {
    var newName = template.find("#update-section").value;
    // Do not change the name value if the user types nothing.
    if (newName !== "") {
      Sections.update(Session.get("editing_section"), {$set: {name: newName}});
    }
    Session.set("editing_section", null);
  },

})

Template.add_section.events({
  'click #section-btn': function(evt, template) {
    var newName = template.find("#add-section").value;
    if (newName !== "") {
      Sections.insert({name: newName, act_id: Session.get("current_act_id")});
      $("#add-section").val("");
    }
  }

})


////////// Helper for moves_pane /////////////

Template.moves_pane.loading = function() {
  return !movesHandle.ready();
}

Template.moves_pane.section_selected = function() {
  return !Session.equals('current_section_id',null)
}

Template.moves_pane.moves = function() {
  console.log(Moves.find({section_id: Session.get("current_section_id")}));
  return Moves.find({section_id: Session.get("current_section_id")});
}

Template.moves_pane.editing_move = function() {
  return Session.equals("editing_move", this._id);
}

Template.moves_pane.not_editing_move = function() {
  return Session.equals("editing_move", null);
}

Template.moves_pane.edit_mode = function() {
  return Session.equals('edit_mode', true);
}

Template.display_move.edit_mode = function() {
  return Session.equals('edit_mode', true);
}

Template.display_move.maybe_active = function() {
  return Session.equals("current_move_id", this._id) ? "active" : "";
};


Template.display_move.events({
    'click': function() {
      console.log(this._id + ' move clicked');
      Session.set("current_move_id", this._id);
    },

    'click .glyphicon-pencil': function() {
      console.log(this._id + ' glyphicon-pencil clicked');
      Session.set("editing_move", this._id);
    },

    'click .glyphicon-remove': function() {
      console.log(this._id + ' glyphicon-remove clicked');

      $.prompt("Are you sure you want to delete this move and all information associated with it?", {
            title: "Delete Move",
            buttons: { "No": false, "Yes": true },
            submit: function(e,v,m,f){
              if (v) {
                Moves.remove(Session.get("current_move_id"));
              }
            }
          });
    }
})

Template.update_move.events({
  'click .update-move-btn': function(evt, template) {
    //evt.preventDefault();
    var newName = template.find("#update-move-title").value;
    var newInfo = template.find("#update-move").value;
    if (newName !== "") {
      Moves.update(Session.get("editing_move"), 
        {$set: {
          title: newName,
          description: newInfo
        }
      });
    } else {
      Moves.update(Session.get("editing_move"), 
        {$set: {
          description: newInfo
        }
      });
    }
    Session.set("editing_move", null);
  },
    'submit form': function() {
    return false;
  }
})

Template.add_move.events({
  'click #move-btn': function(evt, template) {
    //evt.preventDefault();
    var newName = template.find("#add-move-title").value;
    var newInfo = template.find("#add-move").value;
    if (newName !== "") {
      Moves.insert(
        {
          title: newName, 
          description: newInfo,
          section_id: Session.get("current_section_id"),
          act_id: Session.get('current_act_id')
        })
      $("#add-move-title").val("");
      $("#add-move").val("");

    }
  },
  'submit #new-move-form': function() {
    return false;
  }
})


////////// Helper for videos_pane ///////////

////////// Helper for weapons_pane //////////

Template.weapons_pane.loading = function() {
  return !weaponsHandle.ready();
}

Template.weapons_pane.edit_mode = function() {
  return Session.equals('edit_mode', true);
}
Template.weapons_pane.move_selected =  function() {
  return !Session.equals('current_move_id', null);
}

Template.weapons_pane.no_weapons = function() {
  return Weapons.find({move_id: Session.get("current_move_id")}).count() == 0;
}

Template.weapons_pane.edit_and_weapons = function() {
  return ((Weapons.find({move_id: Session.get("current_move_id")}).count() != 0) && (Session.equals('edit_mode', true)) );

}

Template.weapons_pane.weapons = function() {
  console.log(Weapons.find({move_id: Session.get("current_move_id")}).fetch())
  return Weapons.find({move_id: Session.get("current_move_id")});
}

Template.weapons_pane.selected = function() {
  return Session.equals('current_weapon_id',this._id)
}

Template.weapons_pane.maybe_active = function() {

  return Session.equals('current_weapon_id',this._id)? "active": "";
}




var num_weapons = function() {
  return Weapons.find({move_id: Session.get("current_move_id")}).count()
}

Template.weapons_pane.zero_edit_unselect = function() {
  return ((Session.equals('edit_mode', true)) && (num_weapons() == 0) && (Session.equals('current_weapon_id',null)))
};

Template.weapons_pane.plural_edit_unselect = function() {
  return ((Session.equals('edit_mode', true)) && (num_weapons() > 0) && (Session.equals('current_weapon_id',null)))
}

Template.weapons_pane.plural_edit_select = function() {
  return ((Session.equals('edit_mode', true)) && (num_weapons() > 0) && (!Session.equals('current_weapon_id',null)))
}

Template.weapons_pane.zero_view_unselect = function() {
  return ((Session.equals('edit_mode', false)) && (num_weapons() == 0) && (Session.equals('current_weapon_id',null)))
}

Template.weapons_pane.plural_view_unselect = function() {
  return ((Session.equals('edit_mode', false)) && (num_weapons() > 0) && (Session.equals('current_weapon_id',null)))
}

Template.weapons_pane.plural_view_select = function() {
  return ((Session.equals('edit_mode', false)) && (num_weapons() > 0) && (!Session.equals('current_weapon_id',null)))
}

Template.weapons_pane.video_and_selected = function() {
  var currentWeapon = Weapons.findOne({_id: Session.get('current_weapon_id')})
  if (currentWeapon) {
    console.log(currentWeapon.video_url)
    return ((currentWeapon.video_url != null) && (currentWeapon.video_url != undefined) && (currentWeapon.video_url != ""));
  }
  return false;
}

Template.weapons_pane.embed_url = function() {
  var getId = function(url) {
    var regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    var match = url.match(regExp);
    if (match && match[2].length == 11) {
      return match[2];
    } else {
      return 'error';
    }
  };
  var embedID = getId(Weapons.findOne({_id: Session.get('current_weapon_id')}).video_url);
  return "http://www.youtube.com/embed/"+embedID;
}

Template.weapons_pane.rendered = function() {
  //setSessionVars();
}



Template.weapons_pane.events({
  'click #new_weapon_btn': function() {

    var newWeaponHTML = 
            '<div style="text-align:center;">' +
            '<label>Weapon name \*</label><br><input type="text" name="fname" value=""><br><br><br>' +
            '<label> Youtube URL (or leave blank)</label><br><input type="text" name="furl" value="">' +
            '' +
            '' +
            '<br>' +
            '<br>Fields marked \* are required<br></div>'
    var newWeaponPrompt = {
      state0: {
        title: 'New Weapon',
        html: newWeaponHTML,
        buttons: { Cancel: -1, Done: 1 },
        focus: 1,
        submit:function(e,v,m,f){ 
          if (f.fname != "" && v==1) {   
            var youtube_url = (f.furl == "")?  null: f.furl;
            var new_weapon_id = Weapons.insert({name: f.fname, video_url: youtube_url, move_id: Session.get('current_move_id'), 
                                                act_id: Session.get('current_act_id')});
            e.preventDefault();
            $.prompt.close();
          }
        },
      },
    };
    $.prompt(newWeaponPrompt);

  },
  'click .weapon-list-item' : function() {
      var weaponID = $(event.target).attr("id").split("-")[1];
      console.log("EVENT TARGET " + weaponID);
      Session.set('current_weapon_id', weaponID)

  },
  'click .glyphicon-pencil': function() {
      console.log($(event.target).attr("id"))
      var weaponID = $(event.target).attr("id").split("-")[1];
      if (Session.equals('edit_mode', true)) {
      var weaponCursor = Weapons.findOne({_id: weaponID});
      var predefined_URL = ((weaponCursor.video_url == null )|| (weaponCursor.video_url == undefined))? "" : weaponCursor.video_url;
      var editHTML =
              '<div style="text-align:center;">' +
              '<label>Weapon name \*</label><br><input type="text" name="fname" value="' + weaponCursor.name + '"><br><br><br>' +
              '<label> Youtube URL (or leave blank)</label><br><input type="text" name="furl" value="' + predefined_URL+'">' +
              '' +
              '' +
              '<br>' +
              '<br>Fields marked \* are required<br></div>'
      var editPrompt = {
        state0: {
            title: 'Currently editing weapon: ' +  weaponCursor.name,
            html: editHTML,
            buttons: { 'Delete this weapon': -10, 'Cancel': -1, 'Save changes': 1 },
            focus: 1,
            submit: function(e1,v1,m1,f1) {
                if (v1 == 1 && f1.actName == "") { alert('The weapon name cannot be left blank'); }
                if (v1 == 1 && f1.actName != "") {
                  Weapons.update({_id: weaponID}, {name: f1.fname, video_url: f1.furl, move_id: Session.get('current_move_id'),
                                                   act_id: Session.get('current_act_id')})
                    e1.preventDefault();
                    $.prompt.close();
                }
                else if (v1 == -1) {
                    e1.preventDefault();
                    $.prompt.close();
                }
                else if (v1 == -10) {
                    e1.preventDefault();
                    $.prompt.goToState('deleteState',false,e1); // goto state1
                }
                e1.preventDefault();

            }
        }, // end state0 (default edit panel)

        'deleteState': {
            title: 'Delete weapon',
            html: 'Are you sure you want to delete the weapon: <span style="color:red;">' + 
                  weaponCursor.name+'</span><br><br>This action cannot be undone<br><br>',
            buttons: { 'Yes, delete this weapon' : -1, 'No, keep this weapon' : 1 },
            focus: 1,
            submit: function(e1,v1,m1,f1) {
                if (v1 == -1) {
                  Weapons.remove({_id: weaponID});
                }
            }
          } // end deleteSlate
        }; // end editPrompt
      $.prompt(editPrompt);



    }
      Session.set('current_weapon_id', weaponID)
  },
      'click .glyphicon-remove': function() {
      console.log(this._id + ' glyphicon-remove clicked');

      $.prompt("Are you sure you want to delete this weapon?", {
            title: "Delete Section",
            buttons: { "No": false, "Yes": true },
            submit: function(e,v,m,f){
              if (v) {
                Weapons.remove(Session.get('current_weapon_id'));
              }
            }
          });
    }

});

Template.add_weapon_form.events({
  'submit #new-weapon-form': function() {
    return false;
  },
    'click #weapon-btn': function(evt, template) {
    var newName = template.find("#add-weapon-name").value;
    var newVideo = template.find("#add-video").value;
    var url = (newVideo == "")? null: newVideo
    if (newName !== "") {
      Weapons.insert(
        {
          name: newName, 
          video_url: url,
          move_id: Session.get("current_move_id"),
          act_id: Session.get('current_act_id')
        })
      $("#add-weapon-name").val("");
      $("#add-video").val("");

    }
  },


});





/*
////////// Helpers for in-place editing //////////

// Returns an event map that handles the "escape" and "return" keys and
// "blur" events on a text input (given by selector) and interprets them
// as "ok" or "cancel".
var okCancelEvents = function (selector, callbacks) {
  var ok = callbacks.ok || function () {};
  var cancel = callbacks.cancel || function () {};

  var events = {};
  events['keyup '+selector+', keydown '+selector+', focusout '+selector] =
    function (evt) {
      if (evt.type === "keydown" && evt.which === 27) {
        // escape = cancel
        cancel.call(this, evt);

      } else if (evt.type === "keyup" && evt.which === 13 ||
                 evt.type === "focusout") {
        // blur/return/enter = ok/submit if non-empty
        var value = String(evt.target.value || "");
        if (value)
          ok.call(this, value, evt);
        else
          cancel.call(this, evt);
      }
    };

  return events;
};

var activateInput = function (input) {
  input.focus();
  input.select();
};

////////// Lists //////////

Template.lists.loading = function () {
  return !listsHandle.ready();
};

Template.lists.lists = function () {
  return Lists.find({}, {sort: {name: 1}});
};

Template.lists.events({
  'mousedown .list': function (evt) { // select list
    Router.setList(this._id);
  },
  'click .list': function (evt) {
    // prevent clicks on <a> from refreshing the page.
    evt.preventDefault();
  },
  'dblclick .list': function (evt, tmpl) { // start editing list name
    Session.set('editing_listname', this._id);
    Deps.flush(); // force DOM redraw, so we can focus the edit field
    activateInput(tmpl.find("#list-name-input"));
  }
});

// Attach events to keydown, keyup, and blur on "New list" input box.
Template.lists.events(okCancelEvents(
  '#new-list',
  {
    ok: function (text, evt) {
      var id = Lists.insert({name: text});
      Router.setList(id);
      evt.target.value = "";
    }
  }));

Template.lists.events(okCancelEvents(
  '#list-name-input',
  {
    ok: function (value) {
      Lists.update(this._id, {$set: {name: value}});
      Session.set('editing_listname', null);
    },
    cancel: function () {
      Session.set('editing_listname', null);
    }
  }));

Template.lists.selected = function () {
  return Session.equals('list_id', this._id) ? 'selected' : '';
};

Template.lists.name_class = function () {
  return this.name ? '' : 'empty';
};

Template.lists.editing = function () {
  return Session.equals('editing_listname', this._id);
};

////////// Todos //////////

Template.todos.loading = function () {
  return todosHandle && !todosHandle.ready();
};

Template.todos.any_list_selected = function () {
  return !Session.equals('list_id', null);
};

Template.todos.events(okCancelEvents(
  '#new-todo',
  {
    ok: function (text, evt) {
      var tag = Session.get('tag_filter');
      Todos.insert({
        text: text,
        list_id: Session.get('list_id'),
        done: false,
        timestamp: (new Date()).getTime(),
        tags: tag ? [tag] : []
      });
      evt.target.value = '';
    }
  }));

Template.todos.todos = function () {
  // Determine which todos to display in main pane,
  // selected based on list_id and tag_filter.

  var list_id = Session.get('list_id');
  if (!list_id)
    return {};

  var sel = {list_id: list_id};
  var tag_filter = Session.get('tag_filter');
  if (tag_filter)
    sel.tags = tag_filter;

  return Todos.find(sel, {sort: {timestamp: 1}});
};

Template.todo_item.tag_objs = function () {
  var todo_id = this._id;
  return _.map(this.tags || [], function (tag) {
    return {todo_id: todo_id, tag: tag};
  });
};

Template.todo_item.done_class = function () {
  return this.done ? 'done' : '';
};

Template.todo_item.editing = function () {
  return Session.equals('editing_itemname', this._id);
};

Template.todo_item.adding_tag = function () {
  return Session.equals('editing_addtag', this._id);
};

Template.todo_item.events({
  'click .check': function () {
    Todos.update(this._id, {$set: {done: !this.done}});
  },

  'click .destroy': function () {
    Todos.remove(this._id);
  },

  'click .addtag': function (evt, tmpl) {
    Session.set('editing_addtag', this._id);
    Deps.flush(); // update DOM before focus
    activateInput(tmpl.find("#edittag-input"));
  },

  'dblclick .display .todo-text': function (evt, tmpl) {
    Session.set('editing_itemname', this._id);
    Deps.flush(); // update DOM before focus
    activateInput(tmpl.find("#todo-input"));
  },

  'click .remove': function (evt) {
    var tag = this.tag;
    var id = this.todo_id;

    evt.target.parentNode.style.opacity = 0;
    // wait for CSS animation to finish
    Meteor.setTimeout(function () {
      Todos.update({_id: id}, {$pull: {tags: tag}});
    }, 300);
  }
});

Template.todo_item.events(okCancelEvents(
  '#todo-input',
  {
    ok: function (value) {
      Todos.update(this._id, {$set: {text: value}});
      Session.set('editing_itemname', null);
    },
    cancel: function () {
      Session.set('editing_itemname', null);
    }
  }));

Template.todo_item.events(okCancelEvents(
  '#edittag-input',
  {
    ok: function (value) {
      Todos.update(this._id, {$addToSet: {tags: value}});
      Session.set('editing_addtag', null);
    },
    cancel: function () {
      Session.set('editing_addtag', null);
    }
  }));

////////// Tag Filter //////////

// Pick out the unique tags from all todos in current list.
Template.tag_filter.tags = function () {
  var tag_infos = [];
  var total_count = 0;

  Todos.find({list_id: Session.get('list_id')}).forEach(function (todo) {
    _.each(todo.tags, function (tag) {
      var tag_info = _.find(tag_infos, function (x) { return x.tag === tag; });
      if (! tag_info)
        tag_infos.push({tag: tag, count: 1});
      else
        tag_info.count++;
    });
    total_count++;
  });

  tag_infos = _.sortBy(tag_infos, function (x) { return x.tag; });
  tag_infos.unshift({tag: null, count: total_count});

  return tag_infos;
};

Template.tag_filter.tag_text = function () {
  return this.tag || "All items";
};

Template.tag_filter.selected = function () {
  return Session.equals('tag_filter', this.tag) ? 'selected' : '';
};

Template.tag_filter.events({
  'mousedown .tag': function () {
    if (Session.equals('tag_filter', this.tag))
      Session.set('tag_filter', null);
    else
      Session.set('tag_filter', this.tag);
  }
});
*/


