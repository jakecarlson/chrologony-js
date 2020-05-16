import { Match } from 'meteor/check';
import { check } from 'meteor/check';
import SimpleSchema from "simpl-schema";

export const NonEmptyString = Match.Where((x) => {
    check(x, String);
    return x.length > 0;
});

export const RecordId = Match.Where(function(str){
    check(str, String);
    return SimpleSchema.RegEx.Id.test(str);
});