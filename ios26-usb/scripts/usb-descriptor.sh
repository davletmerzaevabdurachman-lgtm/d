#!/data/data/com.termux/files/usr/bin/sh
# Invoked by `termux-usb -e`. Termux:API opens the USB device through Android's
# UsbManager and hands us a file descriptor (TERMUX_USB_FD with -E, or $1 on
# older termux-api versions). We read the 18-byte USB device descriptor from it.
FD="${TERMUX_USB_FD:-$1}"
DIR="$(cd "$(dirname "$0")" && pwd)"
exec node "$DIR/usb-descriptor.mjs" "$FD"
