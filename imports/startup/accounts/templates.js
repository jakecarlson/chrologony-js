import { Meteor } from "meteor/meteor";
import { AccountsTemplates } from 'meteor/useraccounts:core';
import { FlowRouter } from "meteor/ostrio:flow-router-extra";
import { LoadingState } from "../../modules/LoadingState";

AccountsTemplates.configure({

    enablePasswordChange: true,
    showLabels: false,
    showForgotPasswordLink: true,
    showResendVerificationEmailLink: true,
    showPlaceholders: true,
    showReCaptcha: true,
    overrideLoginErrors: false,
    homeRoutePath: 'lobby',

    // Hooks
    onLogoutHook: function() {
        Flasher.success('You have successfully logged out.');
        FlowRouter.go('home');
        LoadingState.stop();
    },
    // onSubmitHook: mySubmitFunc,
    // preSignUpHook: myPreSubmitFunc,
    // postSignUpHook: myPostSignUpFunc

    // Texts
    texts: {
        navSignIn: "Login",
        navSignOut: "Logout",
        pwdLink_pre: "",
        pwdLink_link: "Forgot Password?",
        pwdLink_suff: "",
        resendVerificationEmailLink_pre: "",
        resendVerificationEmailLink_link: "Re-send Verification",
        resendVerificationEmailLink_suff: "",
        sep: "OR USE YOUR EXISTING ACCOUNT",
        signInLink_pre: "Already have an account? ",
        signInLink_link: "Log in.",
        signInLink_suff: "",
        signUpLink_pre: "Don't have an account? ",
        signUpLink_link: "Sign up now.",
        signUpLink_suff: "It's free. No email address required.",
        socialAdd: "add",
        socialConfigure: "configure",
        socialRemove: "remove",
        socialSignIn: "Log in",
        socialSignUp: "Sign up",
        socialWith: "with",
        termsPreamble: "clickAgree",
        termsPrivacy: "privacyPolicy",
        termsAnd: "and",
        termsTerms: "terms",
        title: {
            changePwd: "Change Your Password",
            forgotPwd: "Forgot Your Password?",
            resendVerificationEmail: "Re-Send Verification Email",
            resetPwd: "Reset Your Password",
            signIn: "Log In with Username",
            signUp: "Sign Up with Email",
            verifyEmail: "Verify Your Email",
        },
        button: {
            changePwd: "Change Password",
            forgotPwd: "Reset Password",
            resendVerificationEmail: "Send",
            resetPwd: "Reset Password",
            signIn: "Log In",
            signUp: "Sign Up",
        },
        info: {
            emailSent: "An email with instructions on how to reset your password has been sent.",
            emailVerified: "info.emailVerified",
            pwdChanged: "",
            pwdReset: "",
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
            mustBeLoggedIn: "error.accounts. Must be logged in",
            pwdMismatch: "error.pwdsDontMatch",
            validationErrors: "Validation Errors",
            verifyEmailFirst: "Please verify your email prior to logging in by clicking on the link that was sent to you via email.",
        },

    }

});

// This seems to be the only way to override 'Login forbidden'
T9n.map(
    'en',
    {
        error: {
            accounts: {
                'Login forbidden': 'Username and/or password was incorrect. Please try again.',
            }
        }
    }
);

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