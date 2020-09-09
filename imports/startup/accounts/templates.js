import { AccountsTemplates } from 'meteor/useraccounts:core';
import { Flasher } from "../../ui/flasher";
import { FlowRouter } from "meteor/ostrio:flow-router-extra";

AccountsTemplates.configure({

    enablePasswordChange: true,
    showLabels: false,
    showForgotPasswordLink: true,
    showPlaceholders: true,
    showReCaptcha: true,
    homeRoutePath: 'lobby',

    // Hooks
    onLogoutHook: function() {
        Flasher.set('success', 'You have successfully logged out.');
        FlowRouter.go('home');
    },

    // Texts
    texts: {
        navSignIn: "Login",
        navSignOut: "Logout",
        pwdLink_pre: "",
        pwdLink_link: "forgotPassword",
        pwdLink_suff: "",
        resendVerificationEmailLink_pre: "Verification email lost?",
        resendVerificationEmailLink_link: "Send it again",
        resendVerificationEmailLink_suff: "",
        sep: "OR",
        signInLink_pre: "Already have an account? ",
        signInLink_link: "Log in.",
        signInLink_suff: "",
        signUpLink_pre: "Don't have an account? ",
        signUpLink_link: "Sign up now.",
        signUpLink_suff: "It's free. No email address required.",
        socialAdd: "add",
        socialConfigure: "configure",
        socialRemove: "remove",
        socialSignIn: "Log In",
        socialSignUp: "Sign Up",
        socialWith: "with",
        termsPreamble: "clickAgree",
        termsPrivacy: "privacyPolicy",
        termsAnd: "and",
        termsTerms: "terms",
        title: {
            changePwd: "Change Your Password",
            enrollAccount: "Enroll Your Account",
            forgotPwd: "Forgot Your Password?",
            resetPwd: "Reset Your Password",
            signIn: "Login with Username or Email",
            signUp: "Sign Up with Email",
            verifyEmail: "Verify Your Email",
        },
        button: {
            changePwd: "Change Password",
            enrollAccount: "Enroll Account",
            forgotPwd: "Forgot Password",
            resetPwd: "Reset Password",
            signIn: "Log In",
            signUp: "Sign Up",
        },
        info: {
            emailSent: "An email with instructions on how to reset your password has been sent.",
            emailVerified: "info.emailVerified",
            pwdChanged: "info.passwordChanged",
            pwdReset: "info.passwordReset",
            pwdSet: "info.passwordReset",
            signUpVerifyEmail: "You have successfully registered. Please check your email and follow the instructions.",
            verificationEmailSent: "A new email has been sent to you. If the email doesn't show up in your inbox, be sure to check your spam folder.",
        },
        inputIcons: {
            isValidating: "fa fa-spinner fa-spin",
            hasSuccess: "fa fa-check",
            hasError: "fa fa-times",
        },
        errors: {
            accountsCreationDisabled: "Client side accounts creation is disabled!!!",
            cannotRemoveService: "Cannot remove the only active service!",
            captchaVerification: "Captcha verification failed!",
            loginForbidden: "Login failed. Please try again.",
            mustBeLoggedIn: "error.accounts.Must be logged in",
            pwdMismatch: "error.pwdsDontMatch",
            validationErrors: "Validation Errors",
            verifyEmailFirst: "Please verify your email first. Check the email and follow the link.",
        },

    }

});

let pwd = AccountsTemplates.removeField('password');
AccountsTemplates.addField({
    _id: 'username',
    type: 'text',
    required: true,
    func: function(value){
        if (Meteor.isClient) {
            const self = this;
            Meteor.call("user.exists", value, function(err, userExists){
                if (!userExists)
                    self.setSuccess();
                else
                    self.setError(userExists);
                self.setValidating(false);
            });
            return;
        }
        // Server
        return Meteor.call("user.exists", value);
    },
});
AccountsTemplates.addField(pwd);