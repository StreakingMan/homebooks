<script setup lang="ts">
import { $fetch } from 'ofetch';
import { QrcodeStream } from 'vue-qrcode-reader';

const books = ref<Record<string, any>>({});

const result = ref('');
const onDetect = (detectedCodes) => {
  console.log(detectedCodes);

  result.value = JSON.stringify(detectedCodes.map((code) => code.rawValue));
  for (const detectedCode of detectedCodes) {
    const isbn = detectedCode.rawValue;
    if (books.value[isbn]) {
      continue;
    }
    $fetch(`/api/books/${isbn}`, {
      method: 'get',
    }).then((res) => {
      books.value = { ...books.value, [isbn]: res };
    });
  }
};

const paintOutline = (detectedCodes, ctx) => {
  for (const detectedCode of detectedCodes) {
    const [firstPoint, ...otherPoints] = detectedCode.cornerPoints;

    ctx.strokeStyle = 'red';

    ctx.beginPath();
    ctx.moveTo(firstPoint.x, firstPoint.y);
    for (const { x, y } of otherPoints) {
      ctx.lineTo(x, y);
    }
    ctx.lineTo(firstPoint.x, firstPoint.y);
    ctx.closePath();
    ctx.stroke();
  }
};
</script>

<template>
  <div class="m-4">
    <ClientOnly>
      <div class="mx-auto size-[50vw]">
        <qrcode-stream :formats="['ean_13']" :track="paintOutline" @detect="onDetect" />
      </div>
    </ClientOnly>
    <p class="decode-result">
      Last result: <b>{{ result }}</b>
    </p>
    <div class="grid h-[50vh] grid-cols-3 gap-4 overscroll-y-auto">
      <div v-for="(book, isbn) in books" :key="isbn" class="border p-4">
        <h2>{{ book.title }}</h2>
        <p>{{ book.author }}</p>
        <img :src="book.img" alt="cover" />
      </div>
    </div>
  </div>
</template>

<style scoped></style>
