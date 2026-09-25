import sys

from PySide6.QtWidgets import QApplication, QDialog

from ui.main_window import MainWindow
from ui.login_dialog import LoginDialog
from core.auth import get_active_session

if __name__ == "__main__":
    app = QApplication(sys.argv)

    # Prompt station operator authentication
    login_dialog = LoginDialog()
    if login_dialog.exec() == QDialog.Accepted and login_dialog.authenticated_user:
        user = login_dialog.authenticated_user
        win = MainWindow(current_user=user)
        win.show()
        sys.exit(app.exec())
    else:
        # User closed or cancelled sign-in
        sys.exit(0)
