import { DOCK_APPS, FOLDER, HOME_APPS } from '../lib/apps'
import { AppIcon } from './AppIcon'
import { FolderTile } from './Folder'
import { BatteryWidget, CalendarWidget, NotesWidget } from './Widgets'
import type { AppId } from '../types'

interface HomeScreenProps {
  hidden: boolean
  dimmed: boolean
  onOpenApp: (id: AppId, origin: DOMRect | null) => void
  onOpenFolder: () => void
  usbName: string
  usbConnected: boolean
}

export function HomeScreen({ hidden, dimmed, onOpenApp, onOpenFolder, usbName, usbConnected }: HomeScreenProps) {
  return (
    <main className={`home ${hidden ? 'home--hidden' : ''} ${dimmed ? 'home--dimmed' : ''}`} aria-hidden={hidden} inert={hidden} aria-label="Home screen">
      <div className="home__page">
        <div className="widget-row">
          <CalendarWidget onOpen={onOpenApp} />
          <BatteryWidget usbName={usbName} usbConnected={usbConnected} />
        </div>
        <div className="app-grid">
          {HOME_APPS.map((id) => (
            <AppIcon key={id} id={id} onOpen={onOpenApp} />
          ))}
          <FolderTile name={FOLDER.name} apps={FOLDER.apps} onOpenFolder={onOpenFolder} />
        </div>
        <NotesWidget onOpen={onOpenApp} />
      </div>
      <nav className="dock glass glass-refract" aria-label="Dock">
        {DOCK_APPS.map((id) => (
          <AppIcon key={id} id={id} onOpen={onOpenApp} showLabel={false} />
        ))}
      </nav>
    </main>
  )
}
