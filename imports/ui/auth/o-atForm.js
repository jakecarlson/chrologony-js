import { AccountsTemplates } from 'meteor/useraccounts:core';

import './o-atForm.html';

Template.atForm.helpers({

    currentRoute() {
        return AccountsTemplates.getState();
    },

});