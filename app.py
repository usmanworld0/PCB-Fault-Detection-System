import sys

from PySide6.QtWidgets import QApplication, QDialog

from ui.main_window import MainWindow
from ui.login_dialog import LoginDialog

if __name__ == "__main__":
    app = QApplication(sys.argv)

    while True:
        # Prompt station operator authentication
        login_dialog = LoginDialog()
        if login_dialog.exec() == QDialog.Accepted and login_dialog.authenticated_user:
            user = login_dialog.authenticated_user
            win = MainWindow(current_user=user)
            win.show()
            app.exec()
            if not getattr(win, "logged_out", False):
                break
        else:
            # User closed or cancelled sign-in
            break

    sys.exit(0)
