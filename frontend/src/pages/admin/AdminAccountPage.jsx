import { useState } from "react";
import { Mail, LockKeyhole, ShieldCheck } from "lucide-react";

import { api, csrf, messageFrom } from "../../api/client";
import FormField from "../../components/FormField";
import { useAuth } from "../../context/AuthContext";

export default function AdminAccountPage() {
  const { user, refresh } = useAuth();

  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    password: "",
    password_confirmation: "",
  });

  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [emailForm, setEmailForm] = useState({
    email: "",
    current_password: "",
  });

  const [verificationCode, setVerificationCode] = useState("");
  const [emailStep, setEmailStep] = useState("request");
  const [pendingEmail, setPendingEmail] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [emailError, setEmailError] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);

  const changePassword = async (event) => {
    event.preventDefault();

    setPasswordMessage("");
    setPasswordError("");
    setPasswordLoading(true);

    try {
      await csrf();

      const { data } = await api.post(
        "/auth/change-password",
        passwordForm
      );

      setPasswordMessage(data.message);

      setPasswordForm({
        current_password: "",
        password: "",
        password_confirmation: "",
      });
    } catch (error) {
      setPasswordError(messageFrom(error));
    } finally {
      setPasswordLoading(false);
    }
  };

  const requestEmailChange = async (event) => {
    event.preventDefault();

    setEmailMessage("");
    setEmailError("");
    setEmailLoading(true);

    try {
      await csrf();

      const { data } = await api.post(
        "/auth/change-email/request",
        emailForm
      );

      setPendingEmail(data.email);
      setEmailMessage(data.message);
      setEmailStep("verify");
      setVerificationCode("");
    } catch (error) {
      setEmailError(messageFrom(error));
    } finally {
      setEmailLoading(false);
    }
  };

  const verifyEmailChange = async (event) => {
    event.preventDefault();

    setEmailMessage("");
    setEmailError("");
    setEmailLoading(true);

    try {
      await csrf();

      const { data } = await api.post(
        "/auth/change-email/verify",
        {
          code: verificationCode,
        }
      );

      setEmailMessage(data.message);

      setEmailForm({
        email: "",
        current_password: "",
      });

      setVerificationCode("");
      setPendingEmail("");
      setEmailStep("request");

      await refresh();
    } catch (error) {
      setEmailError(messageFrom(error));
    } finally {
      setEmailLoading(false);
    }
  };

  const cancelEmailChange = () => {
    setEmailStep("request");
    setPendingEmail("");
    setVerificationCode("");
    setEmailMessage("");
    setEmailError("");
  };

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-black">
          My Account
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Manage the Super Administrator email and password.
        </p>
      </div>

      <div className="card p-6">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-slate-900 text-white">
            <ShieldCheck size={22} />
          </div>

          <div>
            <div className="font-extrabold">
              Super Administrator
            </div>

            <div className="mt-1 text-sm text-slate-500">
              {user?.name}
            </div>

            <div className="text-sm text-slate-500">
              {user?.email}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6">
        <div className="card p-6">
          <div className="flex items-center gap-3">
            <Mail size={21} />

            <div>
              <h2 className="font-extrabold">
                Change Email
              </h2>

              <p className="text-sm text-slate-500">
                Your new email must be verified before it becomes active.
              </p>
            </div>
          </div>

          {emailStep === "request" ? (
            <form
              onSubmit={requestEmailChange}
              className="mt-5 grid gap-4"
            >
              <FormField label="Current email">
                <input
                  className="input bg-slate-50"
                  value={user?.email || ""}
                  disabled
                />
              </FormField>

              <FormField label="New email">
                <input
                  type="email"
                  className="input"
                  required
                  autoComplete="email"
                  value={emailForm.email}
                  onChange={(event) =>
                    setEmailForm({
                      ...emailForm,
                      email: event.target.value,
                    })
                  }
                />
              </FormField>

              <FormField label="Current password">
                <input
                  type="password"
                  className="input"
                  required
                  autoComplete="current-password"
                  value={emailForm.current_password}
                  onChange={(event) =>
                    setEmailForm({
                      ...emailForm,
                      current_password:
                        event.target.value,
                    })
                  }
                />
              </FormField>

              {emailError && (
                <p className="text-sm font-semibold text-red-600">
                  {emailError}
                </p>
              )}

              {emailMessage && (
                <p className="text-sm font-semibold text-green-600">
                  {emailMessage}
                </p>
              )}

              <button
                type="submit"
                className="btn-primary"
                disabled={emailLoading}
              >
                {emailLoading
                  ? "Sending..."
                  : "Send Verification Code"}
              </button>
            </form>
          ) : (
            <form
              onSubmit={verifyEmailChange}
              className="mt-5 grid gap-4"
            >
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm">
                We sent a 6-digit verification code to:
                <div className="mt-1 font-extrabold">
                  {pendingEmail}
                </div>
              </div>

              <FormField label="Verification code">
                <input
                  className="input"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  required
                  value={verificationCode}
                  onChange={(event) =>
                    setVerificationCode(
                      event.target.value.replace(
                        /\D/g,
                        ""
                      )
                    )
                  }
                />
              </FormField>

              {emailError && (
                <p className="text-sm font-semibold text-red-600">
                  {emailError}
                </p>
              )}

              {emailMessage && (
                <p className="text-sm font-semibold text-green-600">
                  {emailMessage}
                </p>
              )}

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={emailLoading}
                >
                  {emailLoading
                    ? "Verifying..."
                    : "Verify & Change Email"}
                </button>

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={cancelEmailChange}
                  disabled={emailLoading}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3">
            <LockKeyhole size={21} />

            <div>
              <h2 className="font-extrabold">
                Change Password
              </h2>

              <p className="text-sm text-slate-500">
                Enter your current password before setting a new one.
              </p>
            </div>
          </div>

          <form
            onSubmit={changePassword}
            className="mt-5 grid gap-4"
          >
            <FormField label="Current password">
              <input
                type="password"
                className="input"
                required
                autoComplete="current-password"
                value={passwordForm.current_password}
                onChange={(event) =>
                  setPasswordForm({
                    ...passwordForm,
                    current_password:
                      event.target.value,
                  })
                }
              />
            </FormField>

            <FormField label="New password">
              <input
                type="password"
                className="input"
                required
                minLength={8}
                maxLength={128}
                autoComplete="new-password"
                value={passwordForm.password}
                onChange={(event) =>
                  setPasswordForm({
                    ...passwordForm,
                    password: event.target.value,
                  })
                }
              />
            </FormField>

            <FormField label="Confirm new password">
              <input
                type="password"
                className="input"
                required
                minLength={8}
                maxLength={128}
                autoComplete="new-password"
                value={
                  passwordForm.password_confirmation
                }
                onChange={(event) =>
                  setPasswordForm({
                    ...passwordForm,
                    password_confirmation:
                      event.target.value,
                  })
                }
              />
            </FormField>

            {passwordError && (
              <p className="text-sm font-semibold text-red-600">
                {passwordError}
              </p>
            )}

            {passwordMessage && (
              <p className="text-sm font-semibold text-green-600">
                {passwordMessage}
              </p>
            )}

            <button
              type="submit"
              className="btn-primary"
              disabled={passwordLoading}
            >
              {passwordLoading
                ? "Changing..."
                : "Change Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}