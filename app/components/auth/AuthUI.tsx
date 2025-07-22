"use client";

import { useEffect } from "react";
import { firebase } from "@/app/lib/auth/firebaseConfig";
import * as firebaseui from "firebaseui";

import "firebaseui/dist/firebaseui.css";

interface AuthUIProps {
  user: firebase.User | null;
}

export default function AuthUI({ user }: AuthUIProps) {
  useEffect(() => {
    if (!user) {
      console.log("FirebaseUI 초기화 중");

      const ui =
        firebaseui.auth.AuthUI.getInstance() ||
        new firebaseui.auth.AuthUI(firebase.auth());
      ui.start("#firebaseui-auth-container", {
        callbacks: {
          // Called when the user has been successfully signed in.
          signInSuccessWithAuthResult: function (authResult) {
            if (authResult.user) {
              console.log(authResult.user);
            }
            if (authResult.additionalUserInfo) {
              console.log(authResult.additionalUserInfo);
            }
            // Do not redirect.
            return false;
          },
        },

        signInOptions: [
          {
            provider: firebase.auth.GoogleAuthProvider.PROVIDER_ID,
            clientId:
              "756100070951-a5imkvop1rbjb8poeb1q7tnedkd2872d.apps.googleusercontent.com",
          },
          {
            provider: firebase.auth.EmailAuthProvider.PROVIDER_ID,
            requireDisplayName: false,
            signInMethod: "password",
            disableSignUp: {
              status: false,
            },
          },
          firebaseui.auth.AnonymousAuthProvider.PROVIDER_ID,
        ],
        signInFlow: "popup",
        credentialHelper: firebaseui.auth.CredentialHelper.NONE,
        adminRestrictedOperation: {
          status: true,
        },
      });

      ui.disableAutoSignIn();
    }
  }, [user]);

  return (
    <div
      id="firebaseui-auth-container"
      className={`mb-4 ${user ? "hidden" : ""}`}
    />
  );
}