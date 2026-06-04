import { useEffect } from 'react'

export default function useSafari100vh() {
  useEffect(() => {
    const setViewHeight = () => {
      const windowVH = window.innerHeight / 100
      document.documentElement.style.setProperty('--vh', windowVH + 'px')
    }
    setViewHeight()
    // resize会导致页面布局错乱
    // window.addEventListener('resize', setViewHeight)
    document.addEventListener('DOMContentLoaded', setViewHeight)
    return () => {
      // window.removeEventListener('resize', setViewHeight)
      document.removeEventListener('DOMContentLoaded', setViewHeight)
    }
  }, [])
}
