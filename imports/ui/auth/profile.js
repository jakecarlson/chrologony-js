import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { FlowRouter  } from 'meteor/ostrio:flow-router-extra';
import { LoadingState } from '../../modules/LoadingState';

import './profile.html';

Template.profile.helpers({

    name() {
        return Meteor.user().name();
    },

});

Template.profile.events({

    'submit #profile'(e, i) {

        LoadingState.start(e);

        const form = e.target;
        const attrs = {
            name: $(form.name).val(),
        };

        Meteor.call('user.updateProfile', attrs, function(err, success) {
            if (!err) {
                Flasher.success('You have successfully updated your profile.');
                FlowRouter.go('lobby');
            } else {
                Flasher.error('There was an issue updating your profile. Please try again.')
            }
            LoadingState.stop();
        });

    },

});
