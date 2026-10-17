// MRSUPER_FREE_VIDEO_GALLERY_V1
import {
  BrowserRouter,
  Route,
  Routes,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { SiteProvider } from "./context/SiteContext";

import RequireAuth from "./components/RequireAuth";

import PublicLayout from "./layouts/PublicLayout";
import UserLayout from "./layouts/UserLayout";
import AdminLayout from "./layouts/AdminLayout";

// Public pages
import HomePage from "./pages/HomePage";
import CategoriesPage from "./pages/CategoriesPage";
import CoursesPage from "./pages/CoursesPage";
import VideosPage from "./pages/VideosPage";
import CourseDetailPage from "./pages/CourseDetailPage";
import VideoDetailPage from "./pages/VideoDetailPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import LoginPage from "./pages/LoginPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

// User pages
import DashboardPage from "./pages/user/DashboardPage";
import ProfilePage from "./pages/user/ProfilePage";
import MyContentPage from "./pages/user/MyContentPage";
import PaymentsPage from "./pages/user/PaymentsPage";
import PaymentSubmitPage from "./pages/user/PaymentSubmitPage";
import NotificationsPage from "./pages/user/NotificationsPage";
import SupportPage from "./pages/user/SupportPage";
import SettingsPage from "./pages/user/SettingsPage";

// Admin pages
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminAccountPage from "./pages/admin/AdminAccountPage";
import UsersAdminPage from "./pages/admin/UsersAdminPage";
import CategoriesAdminPage from "./pages/admin/CategoriesAdminPage";
import InstructorsAdminPage from "./pages/admin/InstructorsAdminPage";
import CoursesAdminPage from "./pages/admin/CoursesAdminPage";
import VideosAdminPage from "./pages/admin/VideosAdminPage";
import PublicVideosAdminPage from "./pages/admin/PublicVideosAdminPage";
import PaymentsAdminPage from "./pages/admin/PaymentsAdminPage";
import BankAccountsAdminPage from "./pages/admin/BankAccountsAdminPage";
import HomepageAdminPage from "./pages/admin/HomepageAdminPage";
import NavigationAdminPage from "./pages/admin/NavigationAdminPage";
import ThemeAdminPage from "./pages/admin/ThemeAdminPage";
import NotificationsAdminPage from "./pages/admin/NotificationsAdminPage";
import SupportAdminPage from "./pages/admin/SupportAdminPage";
import ReportsAdminPage from "./pages/admin/ReportsAdminPage";
import SettingsAdminPage from "./pages/admin/SettingsAdminPage";
import BrandAssetsAdminPage from "./pages/admin/BrandAssetsAdminPage";

function NotFound() {
  return (
    <div className="container-page py-20 text-center">
      <h1 className="text-5xl font-black">
        404
      </h1>

      <p className="mt-3 muted">
        The page you requested was not found.
      </p>

      <a
        className="btn-primary mt-6"
        href="/"
      >
        Go Home
      </a>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <SiteProvider>
        <AuthProvider>
          <Routes>

            {/* =========================
                Public routes
            ========================== */}
            <Route element={<PublicLayout />}>
              <Route
                index
                element={<HomePage />}
              />

              <Route
                path="categories"
                element={<CategoriesPage />}
              />

              <Route
                path="courses"
                element={<CoursesPage />}
              />

              <Route
                path="courses/:slug"
                element={<CourseDetailPage />}
              />

              <Route
                path="videos"
                element={<VideosPage />}
              />

              <Route
                path="videos/:slug"
                element={<VideoDetailPage />}
              />

              <Route
                path="about"
                element={<AboutPage />}
              />

              <Route
                path="contact"
                element={<ContactPage />}
              />

              <Route
                path="login"
                element={<LoginPage />}
              />

              <Route
                path="register"
                element={<RegisterPage />}
              />

              <Route path="verify-email" element={<VerifyEmailPage />} />

              <Route
                path="forgot-password"
                element={<ForgotPasswordPage />}
              />

              <Route
                path="reset-password"
                element={<ResetPasswordPage />}
              />
            </Route>

            {/* =========================
                User dashboard routes
            ========================== */}
            <Route
              path="dashboard"
              element={
                <RequireAuth>
                  <UserLayout />
                </RequireAuth>
              }
            >
              <Route
                index
                element={<DashboardPage />}
              />

              <Route
                path="profile"
                element={<ProfilePage />}
              />

              <Route
                path="courses"
                element={
                  <MyContentPage type="courses" />
                }
              />

              <Route
                path="videos"
                element={
                  <MyContentPage type="videos" />
                }
              />

              <Route
                path="payments"
                element={<PaymentsPage />}
              />

              <Route
                path="payments/new"
                element={<PaymentSubmitPage />}
              />

              <Route
                path="notifications"
                element={<NotificationsPage />}
              />

              <Route
                path="support"
                element={<SupportPage />}
              />

              <Route
                path="settings"
                element={<SettingsPage />}
              />
            </Route>

            {/* =========================
                Admin routes
            ========================== */}
            <Route
              path="admin"
              element={
                <RequireAuth admin>
                  <AdminLayout />
                </RequireAuth>
              }
            >
              <Route
                index
                element={<AdminDashboardPage />}
              />

              <Route
                path="users"
                element={<UsersAdminPage />}
              />

              <Route
                path="categories"
                element={<CategoriesAdminPage />}
              />

              <Route
                path="instructors"
                element={<InstructorsAdminPage />}
              />

              <Route
                path="courses"
                element={<CoursesAdminPage />}
              />

              <Route
                path="videos"
                element={<PublicVideosAdminPage />}
              />

              <Route
                path="course-lessons"
                element={<VideosAdminPage />}
              />

              <Route
                path="payments"
                element={<PaymentsAdminPage />}
              />

              <Route
                path="bank-accounts"
                element={<BankAccountsAdminPage />}
              />

              <Route
                path="homepage"
                element={<HomepageAdminPage />}
              />

              <Route
                path="navigation"
                element={<NavigationAdminPage />}
              />

              <Route
                path="theme"
                element={<ThemeAdminPage />}
              />

              <Route
                path="notifications"
                element={<NotificationsAdminPage />}
              />

              <Route
                path="support"
                element={<SupportAdminPage />}
              />

              <Route
                path="seo"
                element={<SettingsAdminPage />}
              />

              <Route
                path="assets"
                element={<BrandAssetsAdminPage />}
              />

              <Route
                path="account"
                element={<AdminAccountPage />}
              />

              <Route
                path="reports"
                element={<ReportsAdminPage />}
              />            </Route>

            {/* =========================
                404
            ========================== */}
            <Route
              path="*"
              element={<NotFound />}
            />

          </Routes>
        </AuthProvider>
      </SiteProvider>
    </BrowserRouter>
  );
}