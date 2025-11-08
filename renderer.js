
            // Always move the dialog directly under <body> so that any layout
            // state left by the builder modal cannot influence its size.
            document.body.appendChild(dialog);



            if (needsMove && dialog.parentElement) {
                dialog.parentElement.removeChild(dialog);
                    dialog.removeAttribute('style');
                    dialog.style.setProperty('display', 'flex', 'important');
                    dialog.style.setProperty('align-items', 'center', 'important');
                    dialog.style.setProperty('justify-content', 'center', 'important');
                    dialog.style.setProperty('gap', '0', 'important');

                    card.removeAttribute('style');
                    card.style.setProperty('display', 'flex', 'important');
                    card.style.setProperty('flex-direction', 'column', 'important');
                    card.style.setProperty('align-items', 'center', 'important');
