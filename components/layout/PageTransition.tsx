import { AnimatePresence, motion } from 'framer-motion';

const PageTransition = ({ children, route }: { children: React.ReactNode; route: string }) => (
  <AnimatePresence mode="wait" initial={false}>
    <motion.div
      key={route}
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.38, ease: [0.4, 0, 0.2, 1] }}
      style={{ minHeight: '100vh' }}
    >
      {children}
    </motion.div>
  </AnimatePresence>
);

export default PageTransition;
