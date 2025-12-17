import { Content } from './AppsListComponents/Content.js'

export function AppsList({ world, query, perf, refresh, setRefresh }) {
  return <Content world={world} query={query} perf={perf} refresh={refresh} setRefresh={setRefresh} />
}
