export function createSub(sub) {
  let s = sub;
  const unsubscribe = () => {
    if (s) {
      s.unsubscribe();
    }
  };
  return {
    update(newSub) {
      unsubscribe();
      s = newSub;
    },
    unsubscribe,
  }
}

