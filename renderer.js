


            // После полного закрытия модалки пересчитываем размер окна.
            // Ранее resizeWindow() вызывался до снятия класса .active, из-за чего
            // ViewManager пропускал пересчёт (считая модалку всё ещё открытой).
            if (typeof ViewManager?.resizeWindow === 'function') {
                requestAnimationFrame(() => ViewManager.resizeWindow());
            }
